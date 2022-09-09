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
                sh 'npm install'
                sh 'cd package && npm ci --omit peer &&  npm run build:dev'
                sh 'cd iframe && npm ci && npm run build:dev'
                sh 'ls -al'
            }   
        }

        stage('TF - Init') {  
            steps {
                sh 'pwd; cd terraform; terraform init -input=false'       
            }
        }

        stage('TF - Plan') {
            steps {
                sh 'cd terraform; terraform workspace select ${environment} || terraform workspace new ${environment} '
                sh 'cd terraform; terraform plan -input=false -out tfplan'
                sh 'cd terraform; terraform show -no-color tfplan > tfplan.txt'
                }
        }
        stage('Deploy - Dev') {
            steps {
                sh 'pwd;cd terraform ; terraform apply -input=false  tfplan'    
            }
        }
    }
}