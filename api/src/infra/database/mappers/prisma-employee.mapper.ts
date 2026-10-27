import { UniqueEntityId } from "@src/core/entities/unique-entity-id";
import { Employee as EmployeeDomain } from "@src/domain/manage/enterprise/entities/employee";
import type { Employee } from "../../../../generated/prisma/client";


export class PrismaEmployeeMapper {
  static toPrisma(employee: EmployeeDomain): Employee {
    return {
      id: employee.id.toString(),
      username: employee.username,
      password: employee.password,
      role: employee.role,
      createdAt: employee.createdAt,
      updatedAt: employee.updatedAt || null,
    };
  }

  static toDomain(raw: Employee): EmployeeDomain {
    return EmployeeDomain.create({
      
      username: raw.username,
      password: raw.password,
      role: raw.role,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    }, new UniqueEntityId(raw.id));
  }
}