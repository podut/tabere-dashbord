pipeline {
    agent any

    environment {
        DOCKER_IMAGE    = 'podutpetru/airsoft-admin'
        DOCKER_TAG      = "${BUILD_NUMBER}"
        SUPABASE_URL    = 'https://supabase.petrupodut.dev'
        STORAGE_BUCKET  = 'assets'
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build Docker Image') {
            steps {
                withCredentials([string(credentialsId: 'SUPABASE_ANON_KEY', variable: 'ANON_KEY')]) {
                    sh """
                        docker build \\
                            --build-arg PUBLIC_SUPABASE_URL=${SUPABASE_URL} \\
                            --build-arg PUBLIC_SUPABASE_ANON_KEY=${ANON_KEY} \\
                            --build-arg PUBLIC_STORAGE_BUCKET=${STORAGE_BUCKET} \\
                            -t ${DOCKER_IMAGE}:${DOCKER_TAG} \\
                            -t ${DOCKER_IMAGE}:latest \\
                            .
                    """
                }
            }
        }

        stage('Push to Docker Hub') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'DOCKERHUB_CREDENTIALS',
                    usernameVariable: 'DOCKER_USER',
                    passwordVariable: 'DOCKER_PASS'
                )]) {
                    sh """
                        echo \${DOCKER_PASS} | docker login -u \${DOCKER_USER} --password-stdin
                        docker push ${DOCKER_IMAGE}:${DOCKER_TAG}
                        docker push ${DOCKER_IMAGE}:latest
                        docker logout
                    """
                }
            }
        }

        stage('Deploy via Coolify') {
            steps {
                withCredentials([string(credentialsId: 'COOLIFY_WEBHOOK', variable: 'WEBHOOK_URL')]) {
                    sh "curl -sf -X GET \"\${WEBHOOK_URL}\" || echo 'Coolify webhook called'"
                }
            }
        }

    }

    post {
        always {
            sh "docker rmi ${DOCKER_IMAGE}:${DOCKER_TAG} || true"
            sh "docker rmi ${DOCKER_IMAGE}:latest || true"
        }
        success {
            echo "Deploy reusit: ${DOCKER_IMAGE}:${DOCKER_TAG}"
        }
        failure {
            echo "Pipeline esuat la build #${BUILD_NUMBER}"
        }
    }
}
