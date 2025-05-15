import { CreateMessageDto } from '../dto/create-message.dto';
import { FilterClientsType } from './filter-clients.type';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '@src/user/entities/user.entity';
import { Repository } from 'typeorm';
import { ClientsStatusForCommunication } from '../enums/clients-status.enum';
import { ClientLanguage } from '@src/comunication/interfaces/communication.interfaces';

@Injectable()
export class FilterMethods {
  private usersTypes = [
    ClientsStatusForCommunication.All_Clients,
    ClientsStatusForCommunication.Recurrent,
    ClientsStatusForCommunication.Unique,
  ];

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async getFilteredIds(
    filtertype: FilterClientsType,
  ): Promise<ClientLanguage[]> {
    const { usersType, clients, dto } = filtertype;

    if (this.usersTypes.includes(usersType)) {
      return await this.allClientsTypesFilter(clients, dto);
    }
    return await this.getAllUsers();
  }

  async allClientsTypesFilter(
    clients: any,
    dto: CreateMessageDto,
  ): Promise<ClientLanguage[]> {
    const filteredClientsIds = clients.data
      .filter((client) => {
        const lastVisitDate = client.lastVisit.split('T')[0];
        const ordersVolume = parseFloat(client.ordersVolume);
        const categoryMatch =
          dto.userFilterDto && dto.userFilterDto.orderCategory
            ? client.categoryNames.includes(dto.userFilterDto.orderCategory)
            : true;

        const isStatusMatch =
          dto.userFilterDto && dto.userFilterDto.clientStatus
            ? client.status === dto.userFilterDto.clientStatus ||
              dto.userFilterDto.clientStatus ===
                ClientsStatusForCommunication.All_Clients
            : false;

        const isLastVisitMatch =
          dto.userFilterDto && dto.userFilterDto.lastVisit
            ? lastVisitDate === dto.userFilterDto.lastVisit
            : true;

        const isOrdersVolumeMatch =
          (dto.userFilterDto && dto.userFilterDto.orderPriceFrom !== undefined
            ? ordersVolume >= dto.userFilterDto.orderPriceFrom
            : true) &&
          (dto.userFilterDto && dto.userFilterDto.orderPriceTo !== undefined
            ? ordersVolume <= dto.userFilterDto.orderPriceTo
            : true);

        return (
          isStatusMatch &&
          isLastVisitMatch &&
          isOrdersVolumeMatch &&
          categoryMatch
        );
      })
      .map((client) => ({ clientId: client.id, language: client.language }));

    return filteredClientsIds;
  }

  async getAllUsers(): Promise<ClientLanguage[]> {
    const userQuery = `SELECT id, language
                       FROM user
                       WHERE role = 'USER'
                         AND deleted_at is NULL;`;
    const rawData = await this.userRepository.query(userQuery);

    return rawData.map((row: any) => ({
      clientId: row.id,
      language: row.language,
    }));
  }
}
