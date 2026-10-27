import { AggregateRoot } from "../../../../core/entities/aggregate";
import type { Optional } from "../../../../core/entities/types/optional";
import type { UniqueEntityId } from "../../../../core/entities/unique-entity-id";

export interface EmployeeProps {
  username: string
  password: string

  role: "ADMIN" | "EMPLOYEE"

  createdAt: Date
  updatedAt?: Date
}

export class Employee extends AggregateRoot<EmployeeProps> {
  get username(): string {
    return this.props.username
  }

  get password(): string {
    return this.props.password
  }

  get role(): "ADMIN" | "EMPLOYEE" {
    return this.props.role
  }

  get createdAt(): Date {
    return this.props.createdAt
  }

  get updatedAt(): Date | undefined {
    return this.props.updatedAt
  }

  isAdmin(): boolean {
    return this.props.role === "ADMIN"
  }

  isEmployee(): boolean {
    return this.props.role === "EMPLOYEE"
  }

  static create(props: Optional<EmployeeProps, "createdAt">, id?: UniqueEntityId): Employee {
    const employee = new Employee({
      ...props,
      createdAt: props.createdAt ?? new Date(),
    }, id)

    return employee
  }
}