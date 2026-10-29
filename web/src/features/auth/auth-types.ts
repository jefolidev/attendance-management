export type EmployeeRole = 'ADMIN' | 'EMPLOYEE'

export interface Employee {
  id: string
  username: string
  role: EmployeeRole
}

export interface LoginResponse {
  accessToken: string
  employee: Employee
}
