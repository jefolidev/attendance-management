import type { EmployeeRepository } from "../../../src/domain/manage/application/repositories/employee.repository";
import type { Employee } from "../../../src/domain/manage/enterprise/entities/employee";

export class InMemoryEmployeeRepository implements EmployeeRepository {
    public items: Employee[] = [];

    async create(employee: Employee): Promise<void> {
        this.items.push(employee);
    }

    async findById(id: string): Promise<Employee | null> {
        const employee = this.items.find(employee => employee.id.toString() === id);
        return employee || null;
    }

    async findByUsername(username: string): Promise<Employee | null> {
        const employee = this.items.find(employee => employee.username === username);
        return employee || null;
    }

    async findAll(): Promise<Employee[]> {
        return this.items;
    }

    async findAllAdmins(): Promise<Employee[]> {
      return this.items.filter(employee => employee.isAdmin());
    }

    async findAllEmployees(): Promise<Employee[]> {
      return this.items.filter(employee => employee.isEmployee());
    }

    async findAllByRole(role: "ADMIN" | "EMPLOYEE"): Promise<Employee[]> {
      return this.items.filter(employee => employee.role === role);
    }

    async update(employee: Employee): Promise<void> {
        const index = this.items.findIndex(e => e.id.toString() === employee.id.toString());
        if (index !== -1) {
            this.items[index] = employee;
        }
    }

    async delete(employee: Employee): Promise<void> {
        const index = this.items.findIndex(e => e.id.toString() === employee.id.toString());
        if (index !== -1) {
            this.items.splice(index, 1);
        }
    }
    
}