import dayjs from "dayjs";
import { Entity } from "../../../../core/entities/entity";
import type { Optional } from "../../../../core/entities/types/optional";
import type { UniqueEntityId } from "../../../../core/entities/unique-entity-id";

interface TimeCompensationProps {
  startTime: Date
  endTime: Date

  employeeId: UniqueEntityId
  createdAt: Date
}

export class TimeCompensation extends Entity<TimeCompensationProps> {
  get startTime(): Date {
    return this.props.startTime
  }

  get endTime(): Date {
    return this.props.endTime
  }

  get durationInMinutes(): number {
    return dayjs(this.props.endTime).diff(this.props.startTime, "minute")
  }

  get createdAt(): Date {
    return this.props.createdAt
  }

  get employeeId(): UniqueEntityId {
    return this.props.employeeId
  }

  static create(props: Optional<TimeCompensationProps, "createdAt">, id?: UniqueEntityId): TimeCompensation {
    const timeCompensation = new TimeCompensation({...props, createdAt: new Date()}, id)

    return timeCompensation
  }
}