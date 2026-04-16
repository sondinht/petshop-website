pipeline {
  agent any

  options {
    timestamps()
    disableConcurrentBuilds()
    buildDiscarder(logRotator(numToKeepStr: '20'))
  }

  environment {
    CI = 'true'
    PLAYWRIGHT_BROWSERS_PATH = '/var/lib/jenkins/pw-browsers'
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
          sh 'mkdir -p $PLAYWRIGHT_BROWSERS_PATH'
          sh 'npx playwright install chromium'
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
          sh 'if [ ! -f .env ]; then cp .env.example .env; fi && npx prisma generate && npx prisma migrate deploy && npm run build'
        }
      }
    }

    stage('Playwright Smoke E2E') {
      steps {
        dir('site') {
          sh 'npm run test:e2e:smoke'
        }
      }
      post {
        always {
          junit allowEmptyResults: true, testResults: 'site/test-results/junit/results.xml'
          publishHTML(target: [
            reportDir: 'site/playwright-report',
            reportFiles: 'index.html',
            reportName: 'Playwright Report',
            keepAll: true,
            alwaysLinkToLastBuild: true,
            allowMissing: true
          ])
          archiveArtifacts artifacts: 'site/playwright-report/**,site/test-results/**', allowEmptyArchive: true
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