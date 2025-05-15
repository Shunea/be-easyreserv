import * as dotenv from 'dotenv';
import * as moment from 'moment';
import gre from '../globalRegEx';
import { EMAIL_TEMPLATES } from '@src/constants';
import { I18nContext } from 'nestjs-i18n';

dotenv.config();

const { htmlToText } = require('html-to-text');

async function getTemplate(options: any, i18n: any, request: any) {
  const {
    firstName,
    lastName,
    email,
    phone,
    businessType,
    companyName,
    role,
    companySize,
    message,
  } = options;

  let template = EMAIL_TEMPLATES.contactEmail;

  template = template.replace(
    gre('{contactEmailGreetingMessage}'),
    i18n.t('translation.contactEmailGreetingMessage'),
  );
  template = template.replace(gre('{companyNameText}'), companyName);
  template = template.replace(
    gre('{contactEmailDetailsMessage}'),
    i18n.t('translation.contactEmailDetailsMessage'),
  );
  template = template.replace(gre('{name}'), i18n.t('translation.name'));
  template = template.replace(gre(`{username}`), `${firstName} ${lastName}`);
  template = template.replace(gre('{email}'), i18n.t('translation.email'));
  template = template.replace(gre(`{emailText}`), email);
  template = template.replace(gre('{phone}'), i18n.t('translation.phone'));
  template = template.replace(gre(`{phoneText}`), phone);
  template = template.replace(
    gre('{businessType}'),
    i18n.t('translation.businessType'),
  );
  template = template.replace(gre(`{businessTypeText}`), businessType);
  template = template.replace(
    gre('{companyName}'),
    i18n.t('translation.companyName'),
  );
  template = template.replace(gre(`{companyNameText}`), companyName);
  template = template.replace(gre('{role}'), i18n.t('translation.role'));
  template = template.replace(gre(`{roleText}`), role);
  template = template.replace(
    gre('{companySize}'),
    i18n.t('translation.companySize'),
  );
  template = template.replace(gre(`{companySizeText}`), companySize);
  template = template.replace(gre('{message}'), i18n.t('translation.message'));
  template = template.replace(gre(`{contactEmailMessageText}`), message);
  template = template.replace(gre('{regards}'), i18n.t('translation.regards'));
  template = template.replace(
    gre('{easyreserv_logo}'),
    `${process.env.AWS_STATIC_URL}/images/93c9b253-47b6-4fd5-a7d2-7dbe5837438b.png`,
  );
  template = template.replace(
    gre('{allRightsReserved}'),
    i18n.t('translation.allRightsReserved'),
  );
  template = template.replace(gre('{currentYear}'), moment().year());

  const text = htmlToText(template);

  return { html: template, text };
}

function requestOptions(options) {
  return {
    to: options.to,
    from: options.from,
    subject: options.subject,
    text: options.text,
    html: options.html,
  };
}

function createRequest(options) {
  const request = requestOptions(options);

  const emailRequest = options.replyTo
    ? {
        ...request,
        replyTo: options.replyTo,
      }
    : request;

  return emailRequest;
}

async function sendContactEmail(body: any, i18n: I18nContext, request: any) {
  const template = await getTemplate(body, i18n, request);

  const options = {
    to: process.env.CONTACT_EMAIL,
    from: `${body.companyName} <${body.email}>`,
    html: template.html,
    text: template.text,
    subject: `${i18n.t('translation.contactEmailSubject')} ${body.companyName}`,
  };

  const data = createRequest(options);

  return data;
}

export default sendContactEmail;
