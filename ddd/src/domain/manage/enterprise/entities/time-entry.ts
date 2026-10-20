import { AggregateRoot } from "../../../../core/entities/aggregate";
import type { UniqueEntityId } from "../../../../core/entities/unique-entity-id";

interface TimeEntryProps {
  clockIn: Date
  clockOut?: Date

  breakStart?: Date
  breakEnd?: Date

  employeeId: UniqueEntityId

  updatedAt?: Date
}

export class TimeEntry extends AggregateRoot<TimeEntryProps> {
  get clockIn(): Date {
    return this.props.clockIn
  }

  get clockOut(): Date | undefined {
    return this.props.clockOut
  }

  get breakStart(): Date | undefined {
    return this.props.breakStart
  }

  get breakEnd(): Date | undefined {
    return this.props.breakEnd
  }

  get employeeId(): UniqueEntityId {
    return this.props.employeeId
  }

  get updatedAt(): Date | undefined {
    return this.props.updatedAt
  }
  
  static create(props: TimeEntryProps, id?: UniqueEntityId): TimeEntry {
    const timeEntry = new TimeEntry(props, id)

    return timeEntry
  }
}
