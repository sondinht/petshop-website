pipeline {
  agent any

  options {
    timestamps()
    disableConcurrentBuilds()
    buildDiscarder(logRotator(numToKeepStr: '20'))
  }

  environment {
    CI = 'true'
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Install') {
      steps {
        dir('site') {
          sh 'npm ci'
        }
      }
    }

    stage('Debug Tooling') {
      steps {
        dir('site') {
          sh 'node -v'
          sh 'npm -v'
          sh 'npx next --version'
          sh 'npx eslint -v'
          sh 'npx tsc -v'
        }
      }
    }

    stage('Lint') {
      steps {
        dir('site') {
          sh 'npm run lint'
        }
      }
    }

    stage('Type Check') {
      steps {
        dir('site') {
          sh 'npm run typecheck'
        }
      }
    }

    stage('Build') {
      steps {
        dir('site') {
          sh 'npm run build'
        }
      }
    }
  }

  post {
    always {
      cleanWs()
    }
  }
}