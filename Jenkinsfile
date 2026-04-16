pipeline {
  agent any

  options {
    timestamps()
    disableConcurrentBuilds()
    buildDiscarder(logRotator(numToKeepStr: '20'))
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Install') {
      steps {
        sh 'npm run install:ci'
      }
    }

    stage('Lint HTML') {
      steps {
        sh 'npm run lint'
      }
    }
  }

  post {
    always {
      cleanWs()
    }
  }
}