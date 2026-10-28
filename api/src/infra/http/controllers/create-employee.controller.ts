// import type { CreateEmployeeUseCase } from "@src/domain/manage/application/use-cases/create-employee";
// import type { FastifyReply, FastifyRequest } from "fastify";
// import { z } from "zod";

// const createEmployeeZodSchema = z.object({
//   username: z.string().min(2).max(100),
//   password: z.string().min(1).max(100),
// });

// export class CreateEmployeeController {
//   constructor(private readonly createEmployeeUseCase: CreateEmployeeUseCase) {}

//   async handle(request: FastifyRequest, response: FastifyReply): Promise<void> {
//     const { username, password } = createEmployeeZodSchema.parse(request.body);

//     try {
//       const employee = await this.createEmployeeUseCase.execute({
//         username, 
//         password,
//         role: "EMPLOYEE",
//         requesterId: 
//       });

//       return response.status(201).json(employee);
//     } catch (error) {
//       return response.status(400).json({ error: error.message });
//     }
//   }
// }