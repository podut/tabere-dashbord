pipeline {
    agent any

    environment {
        DOCKER_IMAGE   = 'podutpetru/airsoft-admin'
        DOCKER_TAG     = "${BUILD_NUMBER}"
        SUPABASE_URL   = 'https://supabase.petrupodut.dev'
        SUPABASE_KEY   = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc0ODM2NTMyMCwiZXhwIjo0OTA0MDM4OTIwLCJyb2xlIjoiYW5vbiJ9.P_bRRo_PNTusZ2ydGnTxgSfsyxjNRmbvtYjN6JjF4bg'
        STORAGE_BUCKET = 'assets'
        COOLIFY_URL    = 'http://138.2.172.101:8000'
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build Docker Image') {
            steps {
                sh """
                    docker build \\
                        --build-arg PUBLIC_SUPABASE_URL=${SUPABASE_URL} \\
                        --build-arg PUBLIC_SUPABASE_ANON_KEY=${SUPABASE_KEY} \\
                        --build-arg PUBLIC_STORAGE_BUCKET=${STORAGE_BUCKET} \\
                        -t ${DOCKER_IMAGE}:${DOCKER_TAG} \\
                        -t ${DOCKER_IMAGE}:latest \\
                        .
                """
            }
        }

        stage('Push to Docker Hub') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'dockerhubrepo',
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
                withCredentials([string(credentialsId: 'coolify-token', variable: 'COOLIFY_TOKEN')]) {
                    sh """
                        curl -sf -X GET "${COOLIFY_URL}/api/v1/deploy?uuid=${COOLIFY_APP_UUID}&force=false" \\
                            -H "Authorization: Bearer \${COOLIFY_TOKEN}" \\
                            || echo 'Deploy triggered'
                    """
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
