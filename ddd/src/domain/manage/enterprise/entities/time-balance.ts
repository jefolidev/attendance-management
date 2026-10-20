import { Entity } from "../../../../core/entities/entity";
import type { UniqueEntityId } from "../../../../core/entities/unique-entity-id";

interface TimeBalanceProps {
  employeeId: UniqueEntityId

  totalWorkedMinutes: number
  totalCompensatedMinutes: number
  totalBalanceMinutes: number

  updatedAt?: Date
}

export class TimeBalance extends Entity<TimeBalanceProps> { 
  get employeeId(): UniqueEntityId {
    return this.props.employeeId
  }

  get totalWorkedMinutes(): number {
    return this.props.totalWorkedMinutes
  }

  get totalCompensatedMinutes(): number {
    return this.props.totalCompensatedMinutes
  }

  get totalBalanceMinutes(): number {
    return this.props.totalBalanceMinutes
  }

  get updatedAt(): Date | undefined {
    return this.props.updatedAt
  }

  static create(props: TimeBalanceProps, id?: UniqueEntityId): TimeBalance {
    const workBalance = new TimeBalance(props, id)

    return workBalance
  }
}