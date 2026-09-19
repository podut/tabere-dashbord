pipeline {
    agent any

    options {
        timeout(time: 20, unit: 'MINUTES')
        disableConcurrentBuilds()
    }

    environment {
        DOCKER_IMAGE           = 'podutpetru/airsoft-admin'
        IMAGE_TAG              = "${BUILD_NUMBER}"
        COOLIFY_URL            = 'http://host.docker.internal:8000'
        COOLIFY_SERVICE_UUID   = 'f2r191wdhse4pqzlcdvd8zjr'
        PUBLIC_SUPABASE_URL    = 'https://supabase.taberehtcmx.ro'
        PUBLIC_SUPABASE_KEY    = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc3OTk5MTA4MCwiZXhwIjo0OTM1NjY0NjgwLCJyb2xlIjoiYW5vbiJ9.4lPxOrqOJp0ucXylIcQeevEI-gqNbz-Xox5y2IXnGD4'
        PUBLIC_STORAGE_BUCKET  = 'assets'
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build & Push (linux/arm64)') {
            steps {
                // Serverul tinta (130.61.130.152) e ARM64 (Oracle Ampere),
                // dar build-ul ruleaza pe un host amd64 - trebuie buildx +
                // emulare QEMU, altfel containerul crapa cu "exec format error".
                withCredentials([usernamePassword(
                    credentialsId: 'dockerhubrepo',
                    usernameVariable: 'DOCKER_USER',
                    passwordVariable: 'DOCKER_PASS'
                )]) {
                    sh 'echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin'
                    sh """
                        docker buildx build --builder arm64builder --platform linux/arm64 \\
                            --build-arg PUBLIC_SUPABASE_URL=${PUBLIC_SUPABASE_URL} \\
                            --build-arg PUBLIC_SUPABASE_ANON_KEY=${PUBLIC_SUPABASE_KEY} \\
                            --build-arg PUBLIC_STORAGE_BUCKET=${PUBLIC_STORAGE_BUCKET} \\
                            -t ${DOCKER_IMAGE}:${IMAGE_TAG} \\
                            -t ${DOCKER_IMAGE}:latest \\
                            --push .
                    """
                }
            }
        }

        stage('Deploy via Coolify') {
            steps {
                withCredentials([string(credentialsId: 'coolify-token', variable: 'COOLIFY_TOKEN')]) {
                    echo "Triggering Coolify redeploy..."
                    sh "curl -sf -X GET -H 'Authorization: Bearer ${COOLIFY_TOKEN}' '${COOLIFY_URL}/api/v1/deploy?uuid=${COOLIFY_SERVICE_UUID}&force=false'"

                    echo "Waiting 30s for container to start..."
                    sh "sleep 30"

                    sh "curl -sf --max-time 15 https://admin.taberehtcmx.ro/ || echo 'Health check: verifica manual'"
                }
            }
        }

    }

    post {
        always {
            sh "docker logout"
            sh "docker rmi ${DOCKER_IMAGE}:${IMAGE_TAG} ${DOCKER_IMAGE}:latest || true"
        }
        success {
            echo "Deploy airsoft-admin reusit: ${DOCKER_IMAGE}:${IMAGE_TAG}"
        }
        failure {
            echo "Pipeline esuat la build #${BUILD_NUMBER}"
        }
    }
}
