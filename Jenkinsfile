pipeline {

    parameters {
        string(name: 'environment', defaultValue: 'aws', description: 'Workspace for the deployment')
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
                sh 'echo env.GIT_BRANCH'
                script {
                    def branch_nem = scm.branches[0].name
                    if (branch_nem.contains("*/")) {
                    branch_nem = branch_nem.split("\\*/")[1]
                    }
                    echo branch_nem
                }
                //sh 'cd package && npm ci --omit peer --loglevel verbose &&  npm run build:dev --loglevel verbose'
                //sh 'cd iframe && npm install --loglevel verbose && npm ci --loglevel verbose && npm run build:dev --loglevel verbose'
                sh 'ls -al iframe/build/'
            }   
        }

        stage('TF - Init') {  
            steps {
                script {
                    if (branch_nem == 'dev') {
                        sh 'pwd; cd terraform_dev; terraform init -input=false'  
                    } else {
                        sh "echo 'Wrong Branch!!'"
                    }
                }
     
            }
        }

        stage('TF - Plan') {
            steps {
                sh 'cd terraform_dev; terraform workspace select ${environment} || terraform workspace new ${environment} '
                sh 'cd terraform_dev; terraform plan -input=false -out tfplan'
                sh 'cd terraform_dev; terraform show -no-color tfplan > tfplan.txt'
                }
        }
        stage('Deploy - Dev') {
            steps {
                sh 'pwd;cd terraform_dev ; terraform apply -input=false  tfplan'    
            }
        }
    }
}