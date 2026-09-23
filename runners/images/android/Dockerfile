FROM ghcr.io/cirruslabs/android-sdk:35
WORKDIR /workspace
ENV CI=1 GRADLE_USER_HOME=/tmp/gradle
RUN apt-get update && apt-get install -y --no-install-recommends openjdk-17-jdk unzip && rm -rf /var/lib/apt/lists/*
