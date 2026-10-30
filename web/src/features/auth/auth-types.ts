export type EmployeeRole = 'ADMIN' | 'EMPLOYEE'

export interface User {
  id: string
  username: string
  role: EmployeeRole
}

export type Employee = User

export interface LoginResponse {
  accessToken: string
  employee: User
}
