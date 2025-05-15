import * as dotenv from 'dotenv';
import * as moment from 'moment';
import gre from '../globalRegEx';
import { EMAIL_TEMPLATES } from '@src/constants';
import { I18nContext } from 'nestjs-i18n';

dotenv.config();

const { htmlToText } = require('html-to-text');

async function getTemplate(token: string, i18n: any, request: any) {
  let template = request.isMobileDevice
    ? EMAIL_TEMPLATES.resetPasswordMobileEmail
    : EMAIL_TEMPLATES.resetPasswordWebEmail;

  template = template.replace(
    gre('{reset_password_link}'),
    `${process.env.DASHBOARD_URL}/reset-password/${token}`,
  );
  template = template.replace(
    gre('{troubleSigningIn}'),
    i18n.t('translation.troubleSigningIn'),
  );
  template = template.replace(
    gre('{resettingYourPasswordIsEasy}'),
    i18n.t('translation.resettingYourPasswordIsEasy'),
  );
  template = template.replace(
    gre('{ignoreThisResetEmail}'),
    i18n.t('translation.ignoreThisResetEmail'),
  );
  template = template.replace(
    gre('{yourVerificationCodeText}'),
    request.isMobileDevice
      ? i18n.t('translation.yourVerificationCodeText')
      : '',
  );
  template = template.replace(
    gre('{yourVerificationCodeToken}'),
    request.isMobileDevice ? token : '',
  );
  template = template.replace(
    gre('{clickOnTheButtonBelowToChangePassword}'),
    !request.isMobileDevice
      ? i18n.t('translation.clickOnTheButtonBelowToChangePassword')
      : '',
  );
  template = template.replace(
    gre('{changeYourPassword}'),
    !request.isMobileDevice ? i18n.t('translation.changeYourPassword') : '',
  );
  template = template.replace(
    gre('{pleaseUseThisLink}'),
    !request.isMobileDevice ? i18n.t('translation.pleaseUseThisLink') : '',
  );
  template = template.replace(gre('{regards}'), i18n.t('translation.regards'));
  template = template.replace(
    gre('{yourFriendsAtEasyReserv}'),
    i18n.t('translation.yourFriendsAtEasyReserv'),
  );
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

function fromEmail(options: any): string {
  return options && options.from ? options.from : process.env.SMTP_USERNAME;
}

function requestOptions(options) {
  return {
    to: options.to,
    from: `EasyReserv <${fromEmail(options)}>`,
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

async function sendResetPassword(body: any, i18n: I18nContext, request: any) {
  const { email: to, token } = body;

  const template = await getTemplate(token, i18n, request);

  const options = {
    to,
    html: template.html,
    text: template.text,
    subject: i18n.t('translation.resetYourPassword'),
  };

  const data = createRequest(options);

  return data;
}

export default sendResetPassword;
