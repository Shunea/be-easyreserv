import { IFilter } from '@src/middlewares/QueryParser';
import { SelectQueryBuilder } from 'typeorm';

export function toTitleCase(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export class FilterUtils {
  static applyFilters(
    queryBuilder: SelectQueryBuilder<any>,
    alias: string,
    filter: IFilter,
  ): void {
    if (!filter || !filter.filter) {
      return;
    }

    const aliasPrefix = alias ? `${alias}.` : '';
    const datePattern = /^\d{4}-\d{2}-\d{2}$/;

    for (const [key, value] of Object.entries(filter.filter)) {
      if (key === 'startDate' || key === 'endDate') {
        continue;
      }

      let condition: string;

      if (Array.isArray(value)) {
        condition = `${aliasPrefix}${key} IN (:...${key})`;
      } else if (datePattern.test(value as string)) {
        condition = `DATE(${aliasPrefix}${key}) = :${key}`;
      } else {
        condition = `${aliasPrefix}${key} = :${key}`;
      }

      queryBuilder.andWhere(condition, { [key]: value });
    }
  }

  static applySearch(
    queryBuilder: SelectQueryBuilder<any>,
    alias: string,
    filter: IFilter,
    columns: string[],
  ): void {
    if (!filter || !filter.search) {
      return;
    }

    const aliasPrefix = alias ? `${alias}.` : '';
    const searchConditions = columns
      .map((column) =>
        !column.includes('.') ? `${aliasPrefix}${column}` : column,
      )
      .map((column) => `${column} LIKE :value`)
      .join(' OR ');

    queryBuilder.andWhere(`(${searchConditions})`, {
      value: `%${filter.search.toString()}%`,
    });
  }

  static applySorting(
    queryBuilder: SelectQueryBuilder<any>,
    alias: string,
    filter: IFilter,
  ): void {
    if (!filter || !filter.sortBy) {
      return;
    }

    const aliasPrefix = alias ? `${alias}.` : '';
    const [column, order] = Object.entries(filter.sortBy)[0];

    if (column) {
      queryBuilder.addOrderBy(
        `${aliasPrefix}${column}`,
        order as 'ASC' | 'DESC',
      );
    }
  }

  static applyPagination(
    queryBuilder: SelectQueryBuilder<any>,
    getType: string,
    filter: IFilter,
  ): void {
    if (!filter || filter.all === 'true') {
      return;
    }

    const { skip, limit } = filter;

    if (getType === 'getRawMany') {
      queryBuilder.offset(skip).limit(limit);
    } else if (getType === 'getMany') {
      queryBuilder.skip(skip).take(limit);
    }
  }

  static applyRangeFilter(
    queryBuilder: SelectQueryBuilder<any>,
    alias: string,
    columnName: string,
    filter: IFilter,
  ): void {
    if (!filter || !filter.filter) {
      return;
    }

    const aliasPrefix = alias ? `${alias}.` : '';
    const { startDate, endDate } = filter.filter;
    const filterValues: any[] = Object.values(filter.filter);

    if (startDate && endDate) {
      queryBuilder.andWhere(
        `${aliasPrefix}${columnName} BETWEEN :startDate AND :endDate`,
        {
          startDate: new Date(startDate),
          endDate: new Date(endDate),
        },
      );
    } else if (
      filterValues.length > 0 &&
      filterValues.every(
        (value) =>
          Array.isArray(value) &&
          value.every((element) => typeof element === 'number'),
      )
    ) {
      queryBuilder.andWhere(
        `${aliasPrefix}${columnName} BETWEEN :minValue AND :maxValue`,
        {
          minValue: Math.min(...filterValues.flat()),
          maxValue: Math.max(...filterValues.flat()),
        },
      );
    }
  }
}
