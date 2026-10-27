import { faker } from '@faker-js/faker';
import type { UniqueEntityId } from '@src/core/entities/unique-entity-id';
import { Employee, type EmployeeProps } from '@src/domain/manage/enterprise/entities/employee';

export function makeEmployee(
  override?: Partial<EmployeeProps>,
  id?: UniqueEntityId,
) {
  const employee = Employee.create(
    {
      username: faker.internet.username(),
      role: 'EMPLOYEE',
      password: faker.internet.password(),
      ...override,
    },
    id,
  )

  return employee
}