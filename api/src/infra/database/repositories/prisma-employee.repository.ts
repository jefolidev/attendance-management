import type { EmployeeRepository } from "../../../domain/manage/application/repositories/employee.repository";
import type { Employee } from "../../../domain/manage/enterprise/entities/employee";

export class PrismaEmployeeRepository implements EmployeeRepository {
    async create(employee: Employee): Promise<void> {
      
      
    }
    async findById(id: string): Promise<Employee | null> {
        throw new Error("Método não implementado.");
    }
    async findByUsername(username: string): Promise<Employee | null> {
        throw new Error("Método não implementado.");
    }
    async findAll(): Promise<Employee[]> {
        throw new Error("Método não implementado.");
    }
    async findAllAdmins(): Promise<Employee[]> {
        throw new Error("Método não implementado.");
    }
    async findAllEmployees(): Promise<Employee[]> {
        throw new Error("Método não implementado.");
    }
    async findAllByRole(role: "ADMIN" | "EMPLOYEE"): Promise<Employee[]> {
        throw new Error("Método não implementado.");
    }
    async update(employee: Employee): Promise<void> {
        throw new Error("Método não implementado.");
    }
    async delete(employee: Employee): Promise<void> {
        throw new Error("Método não implementado.");
    }
} 