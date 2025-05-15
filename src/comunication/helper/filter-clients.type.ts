import { CreateMessageDto } from '../dto/create-message.dto';
import { ClientsStatusForCommunication } from '../enums/clients-status.enum';

export type FilterClientsType = {
  usersType: ClientsStatusForCommunication;
  clients: any;
  dto: CreateMessageDto;
};
