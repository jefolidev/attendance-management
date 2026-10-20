import { AggregateRoot } from "../../../../core/entities/aggregate";
import type { Optional } from "../../../../core/entities/types/optional";
import type { UniqueEntityId } from "../../../../core/entities/unique-entity-id";

interface EmployeeProps {
  username: string
  password: string

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

  get createdAt(): Date {
    return this.props.createdAt
  }

  get updatedAt(): Date | undefined {
    return this.props.updatedAt
  }

  static create(props: Optional<EmployeeProps, "createdAt">, id?: UniqueEntityId): Employee {
    const employee = new Employee({
      ...props,
      createdAt: props.createdAt ?? new Date(),
    }, id)

    return employee
  }
}