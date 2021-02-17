#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { PersonalWebsiteCdkStack } from '../lib/personal-website-cdk-stack';

const app = new cdk.App();
new PersonalWebsiteCdkStack(app, 'PersonalWebsiteCdkStack');
