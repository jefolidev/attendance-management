import type { EmployeeRepository } from "@src/domain/manage/application/repositories/employee.repository";
import { Employee as EmployeeDomain } from "@src/domain/manage/enterprise/entities/employee";
import type { Employee, PrismaClient } from "../../../../../generated/prisma/client";
import { PrismaEmployeeMapper } from "../../mappers/prisma-employee.mapper";

export class PrismaEmployeeRepository implements EmployeeRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(employee: EmployeeDomain): Promise<void> {
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

  async findById(id: string): Promise<EmployeeDomain | null> {
    const employee = await this.prisma.employee.findUnique({
      where: { id },
    });

    return employee ? PrismaEmployeeMapper.toDomain(employee) : null;
  }

  async findByUsername(username: string): Promise<EmployeeDomain | null> {
    const employee = await this.prisma.employee.findFirst({
      where: { username },
    });

    return employee ? PrismaEmployeeMapper.toDomain(employee) : null;
  }

  async findAll(): Promise<EmployeeDomain[]> {
    const employees = await this.prisma.employee.findMany();

    return employees.map((employee: Employee) => PrismaEmployeeMapper.toDomain(employee));
  }

  async findAllAdmins(): Promise<EmployeeDomain[]> {
    return this.findAllByRole("ADMIN");
  }

  async findAllEmployees(): Promise<EmployeeDomain[]> {
    return this.findAllByRole("EMPLOYEE");
  }

  async findAllByRole(role: "ADMIN" | "EMPLOYEE"): Promise<EmployeeDomain[]> {
    const employees = await this.prisma.employee.findMany({
      where: { role },
    });

    return employees.map((employee) => PrismaEmployeeMapper.toDomain(employee));
  }

  async update(employee: EmployeeDomain): Promise<void> {
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

  async delete(employee: EmployeeDomain): Promise<void> {
    await this.prisma.employee.delete({
      where: { id: employee.id.toString() },
    });
  }
}