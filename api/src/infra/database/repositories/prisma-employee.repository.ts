import type { EmployeeRepository } from "../../../domain/manage/application/repositories/employee.repository";
import { Employee } from "../../../domain/manage/enterprise/entities/employee";
import { UniqueEntityId } from "../../../core/entities/unique-entity-id";
import {
  PrismaClient,
  type Employee as PrismaEmployee,
} from "../../../../generated/prisma/client.ts";

export class PrismaEmployeeRepository implements EmployeeRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(employee: Employee): Promise<void> {
    await this.prisma.employee.create({
      data: {
        id: employee.id.toString(),
        username: employee.username,
        password: employee.password,
        role: employee.role,
        createdAt: employee.createdAt,
        updatedAt: employee.updatedAt,
      },
    });
  }

  async findById(id: string): Promise<Employee | null> {
    const employee = await this.prisma.employee.findUnique({
      where: { id },
    });

    return employee ? this.toDomain(employee) : null;
  }

  async findByUsername(username: string): Promise<Employee | null> {
    const employee = await this.prisma.employee.findFirst({
      where: { username },
    });

    return employee ? this.toDomain(employee) : null;
  }

  async findAll(): Promise<Employee[]> {
    const employees = await this.prisma.employee.findMany();

    return employees.map((employee) => this.toDomain(employee));
  }

  async findAllAdmins(): Promise<Employee[]> {
    return this.findAllByRole("ADMIN");
  }

  async findAllEmployees(): Promise<Employee[]> {
    return this.findAllByRole("EMPLOYEE");
  }

  async findAllByRole(role: "ADMIN" | "EMPLOYEE"): Promise<Employee[]> {
    const employees = await this.prisma.employee.findMany({
      where: { role },
    });

    return employees.map((employee) => this.toDomain(employee));
  }

  async update(employee: Employee): Promise<void> {
    await this.prisma.employee.update({
      where: { id: employee.id.toString() },
      data: {
        username: employee.username,
        password: employee.password,
        role: employee.role,
        updatedAt: employee.updatedAt ?? new Date(),
      },
    });
  }

  async delete(employee: Employee): Promise<void> {
    await this.prisma.employee.delete({
      where: { id: employee.id.toString() },
    });
  }

  private toDomain(employee: PrismaEmployee): Employee {
    return Employee.create(
      {
        username: employee.username,
        password: employee.password,
        role: employee.role,
        createdAt: employee.createdAt,
        updatedAt: employee.updatedAt,
      },
      new UniqueEntityId(employee.id),
    );
  }
}