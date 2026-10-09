import {randomUUID} from 'node:crypto';

/**
 * Async PostgreSQL persistence slice for the core conversation workflow.
 * This repository is intentionally explicit; it does not pretend to implement
 * the legacy synchronous Store API or replace its callers automatically.
 */
export function createPostgresRepository(db){
  if(!db||typeof db.query!=='function'||typeof db.transaction!=='function')throw new TypeError('postgres_database_required');
  const now=()=>new Date().toISOString();
  return {
    async createUser({id=randomUUID(),email,passwordHash}){
      if(!email||!passwordHash)throw new TypeError('email_and_password_hash_required');
      const result=await db.query('INSERT INTO users(id,email,password_hash,created_at) VALUES($1,$2,$3,$4) RETURNING id,email,created_at',[id,String(email).trim().toLowerCase(),passwordHash,now()]);
      return result.rows[0];
    },
    async getUserByEmail(email){
      const result=await db.query('SELECT id,email,created_at FROM users WHERE email=$1',[String(email).trim().toLowerCase()]);
      return result.rows[0]||null;
    },
    async createProject({userId,id=randomUUID(),name,slug,repoPath=null}){
      if(!userId||!name||!slug)throw new TypeError('user_id_name_and_slug_required');
      const timestamp=now();
      const result=await db.query('INSERT INTO projects(id,user_id,name,slug,repo_path,created_at,updated_at) VALUES($1,$2,$3,$4,$5,$6,$6) RETURNING id,user_id,name,slug,repo_path,created_at,updated_at',[id,userId,String(name).trim(),String(slug).trim().toLowerCase(),repoPath,timestamp]);
      return result.rows[0];
    },
    async listProjects({userId,limit=50}){
      if(!userId)throw new TypeError('user_id_required');
      const safeLimit=Math.min(Math.max(Number.parseInt(limit,10)||50,1),100);
      const result=await db.query('SELECT id,user_id,name,slug,repo_path,created_at,updated_at FROM projects WHERE user_id=$1 ORDER BY updated_at DESC,id LIMIT $2',[userId,safeLimit]);
      return result.rows;
    },
    async createSession({userId,projectId,id=randomUUID(),title='New conversation'}){
      if(!userId||!projectId)throw new TypeError('user_id_and_project_id_required');
      const timestamp=now();
      const result=await db.query('INSERT INTO sessions(id,project_id,user_id,title,created_at,updated_at) SELECT $1,p.id,$2,$4,$5,$5 FROM projects p WHERE p.id=$3 AND p.user_id=$2 RETURNING id,project_id,user_id,title,created_at,updated_at',[id,userId,projectId,String(title).trim()||'New conversation',timestamp]);
      if(!result.rowCount)throw new Error('project_not_found_or_forbidden');
      return result.rows[0];
    },
    async appendMessage({userId,sessionId,id=randomUUID(),role,content,metadata=null}){
      if(!userId||!sessionId||!['system','user','assistant','tool'].includes(role)||typeof content!=='string')throw new TypeError('invalid_message_input');
      const timestamp=now();
      const result=await db.query('INSERT INTO messages(id,session_id,role,content,metadata_json,created_at) SELECT $1,s.id,$3,$4,$5,$6 FROM sessions s WHERE s.id=$2 AND s.user_id=$7 RETURNING id,session_id,role,content,metadata_json,created_at',[id,sessionId,role,content,metadata==null?null:JSON.stringify(metadata),timestamp,userId]);
      if(!result.rowCount)throw new Error('session_not_found_or_forbidden');
      return result.rows[0];
    },
    async listMessages({userId,sessionId,limit=100}){
      if(!userId||!sessionId)throw new TypeError('user_id_and_session_id_required');
      const safeLimit=Math.min(Math.max(Number.parseInt(limit,10)||100,1),500);
      const result=await db.query('SELECT m.id,m.session_id,m.role,m.content,m.metadata_json,m.created_at FROM messages m JOIN sessions s ON s.id=m.session_id WHERE s.id=$1 AND s.user_id=$2 ORDER BY m.created_at,m.id LIMIT $3',[sessionId,userId,safeLimit]);
      return result.rows;
    }
  };
}
