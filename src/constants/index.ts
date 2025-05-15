import * as fs from 'fs';
import * as path from 'path';
import { minify } from 'html-minifier';

export enum Environments {
  development = 'development',
  test = 'test',
  production = 'production',
}

const MINIFYOPTIONS = {
  removeAttributeQuotes: true,
  collapseWhitespace: true,
  removeComments: true,
};

function getMinifiedTemplate(template: string, options) {
  return minify(template, { ...MINIFYOPTIONS, ...options });
}

function readHTMLFile(filePath: string, options?) {
  const template = fs.readFileSync(filePath, 'utf8');
  return getMinifiedTemplate(template, options);
}

export const DUMMY_ID = '00000000-0000-0000-0000-000000000000';
export const SPECIAL_CHARACTERS = '@$!%*?&#';
export const ALL_CHARACTERS =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
export const REGEX_EMAIL_VALIDATION =
  /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/;
export const REGEX_UUID_VALIDATION =
  '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';
export const FILE_MIMES = {
  'image/gif': 'gif',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/x-png': 'png',
  'application/pdf': 'pdf',
};

export const EMAIL_TEMPLATES = {
  resetPasswordMobileEmail: readHTMLFile(
    path.join(__dirname, '../templates', 'resetPasswordMobileEmail.html'),
  ),
  resetPasswordWebEmail: readHTMLFile(
    path.join(__dirname, '../templates', 'resetPasswordWebEmail.html'),
  ),
  verificationMobileEmail: readHTMLFile(
    path.join(__dirname, '../templates', 'verificationMobileEmail.html'),
  ),
  verificationWebEmail: readHTMLFile(
    path.join(__dirname, '../templates', 'verificationWebEmail.html'),
  ),
  suplierRequestTemplate: readHTMLFile(
    path.join(__dirname, '../templates', 'suplierRequestForm.html'),
  ),
  contactEmail: readHTMLFile(
    path.join(__dirname, '../templates', 'contactEmail.html'),
  ),
};

export const ERROR_MESSAGES = {
  accessSuspended:
    'Access to the system has been suspended due to non-payment of the subscription. Please make the payment to restore the service.',
  addressNotFound: 'No results found for the given address.',
  appleIdTokenNotFound: 'Apple user id_token not found',
  cannotRegisterWithoutPlan: 'Cannot register without plan.',
  cannotCreateForeignReservation:
    'It is not possible to make reservations for multiple restaurants simultaneously.',
  cannotCreateReservation: 'Cannot create a reservation at this time.',
  cannotUpdateReservation: 'Cannot update the reservation.',
  categoryNotFound: 'Category not found.',
  datesConflict: 'Start date cannot be after end date.',
  dataAboutLocation:
    'Data about location, city, sector and address, should be provided.',
  documentNotFound: 'Document not found.',
  errorUpdatingQrCode: 'Error updating qrCode.',
  errorQueueingForUser: 'Error queueing notification for user.',
  expiredDate: "Schedule is out of date, you can't perform this action.",
  failedToGenerateQRCode: 'Failed to generate QR code.',
  failedToRetrieveTheFile: 'Failed to retrieve the file from S3.',
  failedToUploadFile: 'Failed to upload the file to S3.',
  failedTelegramNotification: 'Failed to send Telegram notification.',
  favoriteNotFound: 'Favorite records not found.',
  filterMustBeAnObject: 'Filter must be an object.',
  forbidden: 'Forbidden.',
  ingredientNotFound: 'Ingredient not found.',
  ingredientRepeated: `Ingredient :name is repeated in the input`,
  insufficient: 'Insufficient resources.',
  insuficiendVacationDays: "You don't have enough vacation days.",
  invalidEmailAddress: 'Invalid email address.',
  invalidFilterParameter: 'Invalid filter parameter.',
  invalidLimitParameter: 'Invalid limit parameter.',
  invalidPhoneNumber: 'Invalid phone number.',
  invalidPlanPrice: 'Invalid plan price.',
  invalidRefreshToken: 'Invalid refresh token.',
  invalidSendMessageDate: 'Invalid send message date.',
  invalidSkipParameter: 'Invalid skip parameter.',
  invalidStaffRole: 'Invalid staff role.',
  invalidPaymentStatus: 'Invalid payment status.',
  invalidPreparationZone: 'Invalid preparation zone.',
  invalidTimeZone: 'Invalid time zone.',
  invalidToken: 'Invalid token.',
  invalidDateRange: 'Invalid date range.',
  invoiceNotFound: 'Invoice not found.',
  messageAlreadyExists: 'A message with the same name already exists.',
  messageNotFound: 'Message not found',
  noBonusesAvailable: 'No bonuses available for this restaurant.',
  noFileProvided: 'No file provided.',
  noFileKeyProvided: 'No file key provided.',
  noFreeTables: 'No free tables available for the specified date and time.',
  notAllowed: 'Not allowed.',
  notificationNotFound: 'Notification not found.',
  notificationSendingError: 'Oops! Error sending notification.',
  notificationTokenNotFound: 'Notification token not found.',
  paymentIntentNotCreated: 'The payment intent could not be created.',
  passwordMustContain: 'Password must be at least 6 characters.',
  pieceVolumeMustBeProvided: 'Piece volume must be provided.',
  placeNotFound: 'Place not found.',
  placementNotFound: 'Placement not found.',
  placementAlreadyExists: 'Placement with title :title already exists.',
  planHistoryNotFound: 'Plan history not found.',
  planNotFound: 'Plan not found.',
  planExpired:
    'Access to the system has been suspended due to non-payment of the subscription. Please make the payment to restore the service.',
  planTrialPeriodExpired:
    'The trial period for your plan has concluded. Access to the system has been suspended.',
  pleaseProvideAllParams: 'Please provide all parameters!',
  pleaseVerifyYourEmail: 'Please verify your email before logging in.',
  orderAlreadyExists:
    'Product already selected, please modify the existing one.',
  orderNotFound: 'Order not found.',
  productNotFound: 'Product not found.',
  productAlreadyExists: 'Product with title :title already exists.',
  productIngredientNotFound: 'Product ingredient not found.',
  productIngredintNotInStock: 'Product ingredient not enough in stock.',
  purposeAlreadyRegistered: 'Purpose already registered.',
  purposesNotFound: 'Purpose not found.',
  qrCodeNotFound: 'QR code not found.',
  qrCodeDontExistOrWasNotYetScanned:
    'QR code dont exist or was not yet scanned.',
  qrCodeWithThisStatusAlreadyScanned:
    'QR code with this status already scanned.',
  qrCodeCheckInRequired: 'Check-in is required before trying to check-out.',
  refreshTokenExpired: 'Refresh token has expired.',
  refreshTokenNotFound: 'Refresh token not found.',
  registrationUnavailable:
    'Registration unavailable. Contact support via form.',
  reservationDateBeforeStartTime:
    'The reservation date cannot be greater than the start time.',
  reservationNotFound: 'Reservation not found.',
  reservationNotConfirmed: 'Reservation not confirmed.',
  reservationStartTimeBeforeOrEqualEndTime:
    'The reservation start time cannot be equal to or greater than the end time.',
  reservationTimeInThePast: 'The reservation time cannot be in the past.',
  resetPasswordCannotBeCompleted:
    'The password reset cannot be completed because the token has expired.',
  restaurantEmailAlreadyRegistered:
    'A restaurant with the same email already exists.',
  restaurantNameAlreadyRegistered:
    'A restaurant with the same name already exists.',
  restaurantPhoneAlreadyRegistered:
    'A restaurant with the same phone number already exists.',
  restaurantNotFound: 'Restaurant not found.',
  reviewNotFound: 'Review not found.',
  scheduleDateConflicts: 'Schedule date conflicts.',
  scheduleNotFound: 'No active schedule found for this time period.',
  scheduledTimeInPast: 'Scheduled time is in the past.',
  semifinishedProductAlreadyExists: 'Semifinished product with title :title already exists.',
  semifinishedProductNotFound: 'Semifinished product not found.',
  somethingWentWrong: 'Something went wrong.',
  spaceNotFound: 'Space not found.',
  spaceItemNotFound: 'Space item not found.',
  specifyBusinessTypeAndBillingPeriod:
    'Specify the type of business and billing period.',
  staffEmailAlreadyExists: 'Staff with same email already exists.',
  staffNotFound: 'Staff not found.',
  staffPhoneAlreadyExists: 'Staff with same phone number already exists.',
  stockNotFound: 'Stock not found.',
  suplierNotFound: 'Suplier not found.',
  suplierCantBeUpdated: "Suplier can't be updated.",
  tableNotFound: 'Table not found.',
  tableAlreadyReserved: 'There are tables that are already reserved.',
  tokenKeyNotFound: 'Token key not found.',
  typeAlreadyExists: 'Type already exists.',
  transportNotFound: 'Transport not found.',
  transportAlreadyExists:
    'Transport with the same registration number already exists.',
  unaibleToScannQRCode: 'QR code with this status was already scanned today.',
  unauthorized: 'Unauthorized.',
  unknownPrinterType: 'Unknown printer type.',
  unsupportedFileFormat: 'Unsupported file format.',
  userEmailAlreadyExists: 'This email address already exists.',
  userEmailAlreadyRegistered: 'This email address is already registered.',
  userEmailAndPhoneAlreadyExists: 'This email and phone number already exists.',
  userNotFound: 'User not found.',
  userPhoneAlreadyExists: 'This phone number already exists.',
  userPhoneAlreadyRegistered: 'This phone number is already registered.',
  userEmailAndPhoneAlreadyRegistered:
    'This email and phone number are already registered.',
  vacationNotCreated: 'Vacation was not created.',
  vacationNotFound: 'Vacation not found.',
  vacationNotSaved: 'Vacation was not saved.',
  verificationEmailCannotBeCompleted:
    'The email verification cannot be completed because the token has expired.',
  wrongEmailAddress: 'Wrong email address.',
  wrongEmailOrPassword: 'Wrong email or password.',
  wrongFilterParameter: 'Wrong filter parameter.',
  posNotFound: 'Pos not found.',

  alreadyCheckedIn: 'User is already checked in for this schedule.',
  alreadyCheckedOut: 'User is already checked out for this schedule.',
  checkInRequired: 'Check-in is required before checking out.',
  invalidCheckInOutTimes: 'Invalid check-in or check-out times provided.',
  scheduleNotPending: 'Cannot check in - schedule is not in pending state.',
  scheduleNotCheckedIn: 'Cannot check out - user is not checked in.',
  scheduleOutOfTimeframe: 'Schedule time frame does not match check-in/out time.',
  exceededMaxWorkHours: 'Working hours exceeded maximum limit of 19 hours. Hours have been recorded but set to 0.',
};
