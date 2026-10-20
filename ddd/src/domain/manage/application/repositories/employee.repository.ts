import type { Employee } from "../../enterprise/entities/employee";

export abstract class EmployeeRepository {
  abstract create(employee: Employee): Promise<void>
  abstract findById(id: string): Promise<Employee | null>
  abstract findByUsername(username: string): Promise<Employee | null>
  abstract findAll(): Promise<Employee[]>
  abstract findAllAdmins(): Promise<Employee[]>
  abstract findAllEmployees(): Promise<Employee[]>
  abstract findAllByRole(role: "ADMIN" | "EMPLOYEE"): Promise<Employee[]>
  abstract update(employee: Employee): Promise<void>
  abstract delete(employee: Employee): Promise<void>
}