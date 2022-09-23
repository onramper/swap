pipeline {

    parameters {
        string(name: 'environment', defaultValue: 'aws', description: 'Workspace for the deployment')
        string(name: 'branch', defaultValue: 'dev', description: 'branch name')
    }


    environment {
        AWS_ACCESS_KEY_ID = credentials('AWS_ACCESS_KEY_ID')
        AWS_SECRET_ACCESS_KEY = credentials('AWS_SECRET_ACCESS_KEY')
    }

    agent any

    stages {
        stage('Build') {
            steps{
                sh 'ls -al'
                sh "echo '${branch}'"
                //sh 'cd package && npm ci --omit peer --loglevel verbose &&  npm run build:prod --loglevel verbose'
                //sh 'cd iframe && npm install --loglevel verbose && npm ci --loglevel verbose && npm run build:prod --loglevel verbose'
                sh 'ls -al iframe/build/'
            }   
        }

        stage('TF - Init') {  
            steps {
                script {
                    if (branch == 'dev') {
                        sh 'pwd; cd terraform_dev; terraform init -input=false'  
                    }
                    if (branch == 'master'){
                        sh 'pwd; cd terraform_prod; terraform init -input=false'
                    } else {
                        sh "echo 'Wrong Branch!!'"
                    }
                }
     
            }
        }

        stage('TF - Plan') {
            steps {
                script {
                    if (branch == 'dev') {
				        sh 'cd terraform_dev; terraform workspace select ${environment} || terraform workspace new ${environment} '
                        sh 'cd terraform_dev; terraform plan -input=false -out tfplan'
                        sh 'cd terraform_dev; terraform show -no-color tfplan > tfplan.txt'
                    } 
                    if (branch == 'master') {
				        sh 'cd terraform_prod; terraform workspace select ${environment} || terraform workspace new ${environment} '
                        sh 'cd terraform_prod; terraform plan -input=false -out tfplan'
                        sh 'cd terraform_prod; terraform show -no-color tfplan > tfplan.txt'
                    } else {
                        sh "echo 'Wrong Branch!!'"
                    }
                }
                }
        }
        stage('Deploy - Dev') {
            steps {
                script {
                    if (branch == 'dev') {
				        sh 'pwd;cd terraform_dev ; terraform apply -input=false  tfplan'  
                    } 
                    if (branch == 'master') {
                        sh 'pwd;cd terraform_prod ; terraform apply -input=false  tfplan'
                    } else {
                        sh "echo 'Wrong Branch!!'"
                    }
                }
            }
        }
    }
}