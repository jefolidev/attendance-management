import ExcelJS from 'exceljs'
import { randomBytes } from 'node:crypto'
import { hash as hashPassword } from 'bcryptjs'

const FORMAT_VERSION = 'ponto-digital-backup-v1'
const MAX_ROWS_PER_SHEET = 20_000
const MAX_ROWS_PER_WORKBOOK = 50_000

type DataRow = Record<string, unknown>
type ImportIssue = { sheet: string; row: number; field?: string; message: string }

const SHEETS = {
	employees: { name: 'Funcionarios', columns: ['id', 'username', 'passwordHash', 'role', 'createdAt', 'updatedAt'] },
	timeEntries: { name: 'Pontos', columns: ['id', 'employeeId', 'clockIn', 'clockOut', 'breaksJson', 'status', 'updatedAt'] },
	timeBalances: { name: 'Saldos', columns: ['id', 'employeeId', 'balanceMinutes', 'updatedAt'] },
	timeBalanceEntries: { name: 'EventosSaldo', columns: ['id', 'type', 'reason', 'durationInMinutes', 'createdAt', 'employeeId', 'timeBalanceId', 'timeEntryId'] },
	workSchedules: { name: 'Escalas', columns: ['id', 'employeeId', 'startTime', 'endTime', 'breakStartTime', 'breakEndTime', 'lateTolerance', 'breaksPerDay'] },
	workDays: { name: 'DiasTrabalho', columns: ['id', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] },
	workDaysWorkSchedules: { name: 'DiasEscala', columns: ['workDaysId', 'workScheduleId'] },
	workScheduleDayOverrides: { name: 'ExcecoesEscala', columns: ['id', 'workScheduleId', 'dayOfWeek', 'startTime', 'endTime'] },
	timeEntryJustifications: { name: 'Justificativas', columns: ['id', 'type', 'category', 'description', 'createdAt', 'employeeId', 'timeEntryId', 'approvedById'] },
	employeePushSubscriptions: { name: 'AssinaturasPush', columns: ['id', 'endpoint', 'p256dh', 'auth', 'createdAt', 'employeeId'] },
	timeClockNotificationDeliveries: { name: 'EntregasNotificacao', columns: ['id', 'employeeId', 'dateKey', 'kind', 'sentAt'] },
} as const

type Dataset = Record<keyof typeof SHEETS, DataRow[]>

function addDataSheet(workbook: ExcelJS.Workbook, name: string, columns: readonly string[], rows: DataRow[]): void {
	const sheet = workbook.addWorksheet(name)
	sheet.addRow([...columns])
	sheet.views = [{ state: 'frozen', ySplit: 1 }]
	sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: columns.length } }
	sheet.getRow(1).font = { bold: true }
	sheet.columns = columns.map((key) => ({ key, width: Math.min(Math.max(key.length + 4, 16), 34) }))
	for (const row of rows) sheet.addRow(row)
}

function addInstructions(workbook: ExcelJS.Workbook, exportedAt: string): void {
	const instructions = workbook.addWorksheet('Instrucoes')
	instructions.addRows([
		['Backup do Ponto Digital'],
		['formatVersion', FORMAT_VERSION],
		['exportedAt', exportedAt],
		['Como restaurar', 'Importe este arquivo pelo endpoint administrativo de importação. A restauração valida todas as abas antes de gravar e é transacional.'],
		['Identificadores', 'Não altere IDs nem os campos de relacionamento. Os registros ligados usam IDs das outras abas.'],
		['Importação', 'A importação mescla por ID: cria novos registros e atualiza os que já existem. Linhas removidas do arquivo não apagam registros do sistema.'],
		['Datas', 'Datas e horários são exportados em ISO 8601. Durações do banco de horas são minutos inteiros. breaksJson contém JSON.'],
		['Confidencialidade', 'Este arquivo inclui hashes de senha e tokens de notificações push. Guarde-o como dado confidencial e limite o acesso.'],
		['Senhas', 'passwordHash pode ficar vazio para um novo funcionário. Nesse caso, será criada uma senha aleatória desconhecida; um administrador precisará definir a senha antes do primeiro acesso.'],
		['Planilha de origem', 'Para arquivos externos, adapte as colunas aos nomes da linha 1 e mantenha todos os IDs e vínculos.'],
		['Funcionarios', 'id é a chave do funcionário; username deve ser único; role aceita ADMIN ou EMPLOYEE.'],
		['Pontos', 'employeeId aponta para Funcionarios.id. status aceita CLOCKED_IN, CLOCKED_OUT ou ON_BREAK. breaksJson é uma lista JSON de {"start":"data ISO","end":"data ISO ou null"}.'],
		['Saldos e EventosSaldo', 'Saldos.employeeId aponta para Funcionarios.id. EventosSaldo.employeeId, timeBalanceId e timeEntryId apontam para os IDs correspondentes; timeBalanceId e timeEntryId podem ficar vazios. durationInMinutes é inteiro.'],
		['Escalas', 'Escalas.employeeId aponta para Funcionarios.id. DiasTrabalho guarda os dias da semana como TRUE/FALSE; DiasEscala relaciona DiasTrabalho.id a Escalas.id.'],
		['ExcecoesEscala', 'workScheduleId aponta para Escalas.id; dayOfWeek usa 0 para domingo até 6 para sábado.'],
		['Justificativas', 'employeeId e approvedById apontam para Funcionarios.id; timeEntryId aponta para Pontos.id.'],
		['Notificações', 'AssinaturasPush e EntregasNotificacao guardam vínculos de dispositivos e entregas; são restauradas junto com o backup.'],
	])
	instructions.getColumn(1).width = 24
	instructions.getColumn(2).width = 110
	instructions.getRow(1).font = { bold: true, size: 16 }
	instructions.getColumn(2).alignment = { wrapText: true, vertical: 'top' }
}

async function workbookBuffer(workbook: ExcelJS.Workbook): Promise<Buffer> {
	return Buffer.from(await workbook.xlsx.writeBuffer())
}

export async function createBackupTemplateWorkbook(): Promise<Buffer> {
	const workbook = new ExcelJS.Workbook()
	workbook.creator = 'Ponto Digital'
	workbook.created = new Date()
	addInstructions(workbook, new Date().toISOString())
	for (const definition of Object.values(SHEETS)) addDataSheet(workbook, definition.name, definition.columns, [])
	return workbookBuffer(workbook)
}

export async function createBackupWorkbook(prisma: any): Promise<Buffer> {
	const workbook = new ExcelJS.Workbook()
	workbook.creator = 'Ponto Digital'
	workbook.created = new Date()
	addInstructions(workbook, new Date().toISOString())

	const [employees, timeEntries, timeBalances, timeBalanceEntries, workSchedules, workDays, workDaysWorkSchedules, workScheduleDayOverrides, timeEntryJustifications, employeePushSubscriptions, timeClockNotificationDeliveries] = await Promise.all([
		prisma.employee.findMany({ orderBy: { id: 'asc' } }),
		prisma.timeEntry.findMany({ orderBy: { id: 'asc' } }),
		prisma.timeBalance.findMany({ orderBy: { id: 'asc' } }),
		prisma.timeBalanceEntry.findMany({ orderBy: { id: 'asc' } }),
		prisma.workSchedule.findMany({ orderBy: { id: 'asc' } }),
		prisma.workDays.findMany({ orderBy: { id: 'asc' } }),
		prisma.workDaysWorkSchedule.findMany({ orderBy: [{ workDaysId: 'asc' }, { workScheduleId: 'asc' }] }),
		prisma.workScheduleDayOverride.findMany({ orderBy: { id: 'asc' } }),
		prisma.timeEntryJustification.findMany({ orderBy: { id: 'asc' } }),
		prisma.employeePushSubscription.findMany({ orderBy: { id: 'asc' } }),
		prisma.timeClockNotificationDelivery.findMany({ orderBy: { id: 'asc' } }),
	])

	const data: Dataset = {
		employees: employees.map(({ id, username, password, role, createdAt, updatedAt }: any) => ({ id, username, passwordHash: password, role, createdAt: createdAt?.toISOString() ?? null, updatedAt: updatedAt?.toISOString() ?? null })),
		timeEntries: timeEntries.map(({ id, employeeId, clockIn, clockOut, breaks, status, updatedAt }: any) => ({ id, employeeId, clockIn: clockIn.toISOString(), clockOut: clockOut?.toISOString() ?? null, breaksJson: JSON.stringify(breaks), status, updatedAt: updatedAt?.toISOString() ?? null })),
		timeBalances: timeBalances.map(({ id, employeeId, balanceMinutes, updatedAt }: any) => ({ id, employeeId, balanceMinutes, updatedAt: updatedAt?.toISOString() ?? null })),
		timeBalanceEntries: timeBalanceEntries.map(({ id, type, reason, durationInMinutes, createdAt, employeeId, timeBalanceId, timeEntryId }: any) => ({ id, type, reason, durationInMinutes, createdAt: createdAt.toISOString(), employeeId, timeBalanceId, timeEntryId })),
		workSchedules: workSchedules.map(({ id, startTime, endTime, breakStartTime, breakEndTime, lateTolerance, breaksPerDay, employeeId }: any) => ({ id, startTime, endTime, breakStartTime, breakEndTime, lateTolerance, breaksPerDay, employeeId })),
		workDays,
		workDaysWorkSchedules,
		workScheduleDayOverrides: workScheduleDayOverrides.map(({ id, workScheduleId, dayOfWeek, startTime, endTime }: any) => ({ id, workScheduleId, dayOfWeek, startTime, endTime })),
		timeEntryJustifications: timeEntryJustifications.map(({ id, type, category, description, createdAt, employeeId, timeEntryId, approvedById }: any) => ({ id, type, category, description, createdAt: createdAt.toISOString(), employeeId, timeEntryId, approvedById })),
		employeePushSubscriptions: employeePushSubscriptions.map(({ id, endpoint, p256dh, auth, createdAt, employeeId }: any) => ({ id, endpoint, p256dh, auth, createdAt: createdAt.toISOString(), employeeId })),
		timeClockNotificationDeliveries: timeClockNotificationDeliveries.map(({ id, employeeId, dateKey, kind, sentAt }: any) => ({ id, employeeId, dateKey, kind, sentAt: sentAt.toISOString() })),
	}

	for (const [key, definition] of Object.entries(SHEETS) as [keyof typeof SHEETS, (typeof SHEETS)[keyof typeof SHEETS]][]) {
		addDataSheet(workbook, definition.name, definition.columns, data[key])
	}
	return workbookBuffer(workbook)
}

function cellValue(cell: ExcelJS.Cell): unknown {
	const value = cell.value
	if (value && typeof value === 'object') {
		if ('formula' in value || 'sharedFormula' in value) return undefined
		if ('text' in value && typeof value.text === 'string') return value.text
		if ('result' in value) return value.result
	}
	return value
}

function readRows(workbook: ExcelJS.Workbook, name: string, columns: readonly string[], issues: ImportIssue[]): DataRow[] {
	const sheet = workbook.getWorksheet(name)
	if (!sheet) {
		issues.push({ sheet: name, row: 1, message: 'Aba obrigatória ausente.' })
		return []
	}
	if (sheet.rowCount > MAX_ROWS_PER_SHEET + 1) {
		issues.push({ sheet: name, row: MAX_ROWS_PER_SHEET + 2, message: `Limite de ${MAX_ROWS_PER_SHEET} linhas excedido.` })
		return []
	}
	const headerRow = sheet.getRow(1)
	const actualHeaders = Array.from({ length: Math.max(headerRow.cellCount, columns.length) }, (_, index) => String(cellValue(headerRow.getCell(index + 1)) ?? '').trim())
	if (columns.some((column, index) => actualHeaders[index] !== column) || actualHeaders.length !== columns.length) {
		issues.push({ sheet: name, row: 1, message: `Cabeçalhos esperados: ${columns.join(', ')}.` })
		return []
	}
	const rows: DataRow[] = []
	for (let rowNumber = 2; rowNumber <= sheet.rowCount; rowNumber++) {
		const row = sheet.getRow(rowNumber)
		let hasFormula = false
		row.eachCell({ includeEmpty: false }, (cell) => {
			if (cell.value && typeof cell.value === 'object' && ('formula' in cell.value || 'sharedFormula' in cell.value)) hasFormula = true
		})
		if (hasFormula) {
			issues.push({ sheet: name, row: rowNumber, message: 'Fórmulas não são aceitas. Cole valores simples nesta aba.' })
			continue
		}
		const values = columns.map((_, index) => cellValue(row.getCell(index + 1)))
		if (values.every((value) => value === null || value === undefined || value === '')) continue
		rows.push(Object.fromEntries(columns.map((column, index) => [column, values[index]])))
	}
	return rows
}

function textValue(value: unknown, sheet: string, row: number, field: string, issues: ImportIssue[], required = false): string | null {
	if (value === null || value === undefined || value === '') {
		if (required) issues.push({ sheet, row, field, message: 'Campo obrigatório.' })
		return null
	}
	if (typeof value !== 'string') {
		issues.push({ sheet, row, field, message: 'Informe o valor como texto.' })
		return null
	}
	const normalized = value.trim()
	if (required && !normalized) issues.push({ sheet, row, field, message: 'Campo obrigatório.' })
	return normalized
}

function dateValue(value: unknown, sheet: string, row: number, field: string, issues: ImportIssue[], required = false): Date | null {
	if (value === null || value === undefined || value === '') {
		if (required) issues.push({ sheet, row, field, message: 'Data obrigatória.' })
		return null
	}
	let date: Date
	if (value instanceof Date) date = value
	else if (typeof value === 'number') date = new Date(Date.UTC(1899, 11, 30) + value * 86_400_000)
	else if (typeof value === 'string') date = new Date(value)
	else {
		issues.push({ sheet, row, field, message: 'Use uma data Excel válida ou uma data ISO 8601.' })
		return null
	}
	if (!Number.isFinite(date.getTime())) {
		issues.push({ sheet, row, field, message: 'Data inválida.' })
		return null
	}
	return date
}

function integerValue(value: unknown, sheet: string, row: number, field: string, issues: ImportIssue[], required = true): number | null {
	if (value === null || value === undefined || value === '') {
		if (required) issues.push({ sheet, row, field, message: 'Número inteiro obrigatório.' })
		return null
	}
	const number = typeof value === 'number' ? value : typeof value === 'string' && value.trim() !== '' ? Number(value) : NaN
	if (!Number.isSafeInteger(number)) {
		issues.push({ sheet, row, field, message: 'Informe um número inteiro válido.' })
		return null
	}
	return number
}

function booleanValue(value: unknown, sheet: string, row: number, field: string, issues: ImportIssue[]): boolean | null {
	if (typeof value === 'boolean') return value
	if (value === 1 || value === '1' || value === 'true' || value === 'TRUE' || value === 'Sim') return true
	if (value === 0 || value === '0' || value === 'false' || value === 'FALSE' || value === 'Não') return false
	issues.push({ sheet, row, field, message: 'Use Sim/Não ou TRUE/FALSE.' })
	return null
}

function jsonValue(value: unknown, sheet: string, row: number, field: string, issues: ImportIssue[]): unknown {
	if (typeof value !== 'string') {
		issues.push({ sheet, row, field, message: 'Informe JSON válido como texto.' })
		return null
	}
	try { return JSON.parse(value) } catch {
		issues.push({ sheet, row, field, message: 'JSON inválido. Exemplo: []' })
		return null
	}
}

function breaksValue(value: unknown, sheet: string, row: number, issues: ImportIssue[]): { start: string; end: string | null }[] | null {
	const parsed = jsonValue(value, sheet, row, 'breaksJson', issues)
	if (!Array.isArray(parsed)) {
		issues.push({ sheet, row, field: 'breaksJson', message: 'Esperada uma lista de intervalos de pausa.' })
		return null
	}
	const breaks: { start: string; end: string | null }[] = []
	parsed.forEach((entry, index) => {
		if (!entry || typeof entry !== 'object' || !('start' in entry)) {
			issues.push({ sheet, row, field: `breaksJson[${index}]`, message: 'Cada pausa precisa conter start e end.' })
			return
		}
		const start = dateValue(entry.start, sheet, row, `breaksJson[${index}].start`, issues, true)
		const end = entry.end === null ? null : dateValue(entry.end, sheet, row, `breaksJson[${index}].end`, issues, true)
		if (start && (entry.end === null || end)) breaks.push({ start: start.toISOString(), end: end?.toISOString() ?? null })
	})
	return breaks.length === parsed.length ? breaks : null
}

function parseWorkbookRows<T extends DataRow>(rows: DataRow[], name: string, parse: (row: DataRow, sheet: string, rowNumber: number, issues: ImportIssue[]) => T | null, issues: ImportIssue[]): T[] {
	return rows.flatMap((row, index) => {
		const result = parse(row, name, index + 2, issues)
		return result ? [result] : []
	})
}

export async function parseBackupWorkbook(buffer: Buffer): Promise<{ data: Dataset | null; issues: ImportIssue[] }> {
	const workbook = new ExcelJS.Workbook()
	const issues: ImportIssue[] = []
	const xlsxBuffer = new ArrayBuffer(buffer.byteLength)
	new Uint8Array(xlsxBuffer).set(buffer)
	try { await workbook.xlsx.load(xlsxBuffer) } catch {
		return { data: null, issues: [{ sheet: 'Arquivo', row: 1, message: 'O arquivo não é uma pasta Excel .xlsx válida.' }] }
	}
	const instructions = workbook.getWorksheet('Instrucoes')
	const versionCell = instructions?.getRow(2).getCell(2)
	if (!versionCell || cellValue(versionCell) !== FORMAT_VERSION) {
		issues.push({ sheet: 'Instrucoes', row: 2, field: 'formatVersion', message: `Versão de formato inválida; esperado ${FORMAT_VERSION}.` })
	}
	const raw = Object.fromEntries(Object.entries(SHEETS).map(([key, definition]) => [key, readRows(workbook, definition.name, definition.columns, issues)])) as Record<keyof typeof SHEETS, DataRow[]>
	const rowCount = Object.values(raw).reduce((total, rows) => total + rows.length, 0)
	if (rowCount > MAX_ROWS_PER_WORKBOOK) issues.push({ sheet: 'Arquivo', row: 1, message: `Limite total de ${MAX_ROWS_PER_WORKBOOK} registros excedido.` })
	const parse = <T extends DataRow>(key: keyof typeof SHEETS, fn: (row: DataRow, sheet: string, rowNumber: number, issues: ImportIssue[]) => T | null): T[] => parseWorkbookRows(raw[key], SHEETS[key].name, fn, issues)
	const data: Dataset = {
			employees: parse('employees', (r, s, n, e) => {
			const id = textValue(r.id, s, n, 'id', e, true), username = textValue(r.username, s, n, 'username', e, true), passwordHash = textValue(r.passwordHash, s, n, 'passwordHash', e), role = textValue(r.role, s, n, 'role', e, true)
			const createdAt = dateValue(r.createdAt, s, n, 'createdAt', e, true), updatedAt = dateValue(r.updatedAt, s, n, 'updatedAt', e)
			if (role && !['ADMIN', 'EMPLOYEE'].includes(role)) e.push({ sheet: s, row: n, field: 'role', message: 'Use ADMIN ou EMPLOYEE.' })
			if (passwordHash && !/^\$2[aby]\$\d\d\$[./A-Za-z0-9]{53}$/.test(passwordHash)) e.push({ sheet: s, row: n, field: 'passwordHash', message: 'Esperado hash bcrypt exportado pelo sistema; senha em texto não é aceita.' })
			return id && username && role && createdAt ? { id, username, password: passwordHash, role, createdAt, updatedAt } : null
		}),
		timeEntries: parse('timeEntries', (r, s, n, e) => {
			const id = textValue(r.id, s, n, 'id', e, true), employeeId = textValue(r.employeeId, s, n, 'employeeId', e, true), clockIn = dateValue(r.clockIn, s, n, 'clockIn', e, true), clockOut = dateValue(r.clockOut, s, n, 'clockOut', e), breaks = breaksValue(r.breaksJson, s, n, e), status = textValue(r.status, s, n, 'status', e, true), updatedAt = dateValue(r.updatedAt, s, n, 'updatedAt', e)
			if (status && !['CLOCKED_IN', 'CLOCKED_OUT', 'ON_BREAK'].includes(status)) e.push({ sheet: s, row: n, field: 'status', message: 'Status inválido.' })
			if (clockIn && clockOut && clockOut < clockIn) e.push({ sheet: s, row: n, field: 'clockOut', message: 'A saída não pode ser anterior à entrada.' })
			return id && employeeId && clockIn && breaks !== null && status ? { id, employeeId, clockIn, clockOut, breaks, status, updatedAt } : null
		}),
		timeBalances: parse('timeBalances', (r, s, n, e) => {
			const id = textValue(r.id, s, n, 'id', e, true), employeeId = textValue(r.employeeId, s, n, 'employeeId', e, true), balanceMinutes = integerValue(r.balanceMinutes, s, n, 'balanceMinutes', e), updatedAt = dateValue(r.updatedAt, s, n, 'updatedAt', e)
			return id && employeeId && balanceMinutes !== null ? { id, employeeId, balanceMinutes, updatedAt } : null
		}),
		timeBalanceEntries: parse('timeBalanceEntries', (r, s, n, e) => {
			const id = textValue(r.id, s, n, 'id', e, true), type = textValue(r.type, s, n, 'type', e, true), reason = textValue(r.reason, s, n, 'reason', e, true), durationInMinutes = integerValue(r.durationInMinutes, s, n, 'durationInMinutes', e), createdAt = dateValue(r.createdAt, s, n, 'createdAt', e, true), employeeId = textValue(r.employeeId, s, n, 'employeeId', e, true), timeBalanceId = textValue(r.timeBalanceId, s, n, 'timeBalanceId', e), timeEntryId = textValue(r.timeEntryId, s, n, 'timeEntryId', e)
			if (type && !['CREDIT', 'DEBIT'].includes(type)) e.push({ sheet: s, row: n, field: 'type', message: 'Use CREDIT ou DEBIT.' })
			if (reason && !['LATE_ARRIVAL', 'EARLY_DEPARTURE', 'OVERTIME', 'COMPENSATION', 'EXTRA', 'MANUAL_ADJUSTMENT'].includes(reason)) e.push({ sheet: s, row: n, field: 'reason', message: 'Motivo inválido.' })
			return id && type && reason && durationInMinutes !== null && createdAt && employeeId ? { id, type, reason, durationInMinutes, createdAt, employeeId, timeBalanceId, timeEntryId } : null
		}),
		workSchedules: parse('workSchedules', (r, s, n, e) => {
			const id = textValue(r.id, s, n, 'id', e, true), employeeId = textValue(r.employeeId, s, n, 'employeeId', e, true), startTime = textValue(r.startTime, s, n, 'startTime', e, true), endTime = textValue(r.endTime, s, n, 'endTime', e, true), breakStartTime = textValue(r.breakStartTime, s, n, 'breakStartTime', e), breakEndTime = textValue(r.breakEndTime, s, n, 'breakEndTime', e), lateTolerance = integerValue(r.lateTolerance, s, n, 'lateTolerance', e), breaksPerDay = integerValue(r.breaksPerDay, s, n, 'breaksPerDay', e)
			return id && employeeId && startTime && endTime && lateTolerance !== null && breaksPerDay !== null ? { id, employeeId, startTime, endTime, breakStartTime, breakEndTime, lateTolerance, breaksPerDay } : null
		}),
		workDays: parse('workDays', (r, s, n, e) => {
			const id = integerValue(r.id, s, n, 'id', e)
			const values = Object.fromEntries(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => [day, booleanValue(r[day], s, n, day, e)]))
			return id !== null && Object.values(values).every((value) => value !== null) ? { id, ...values } : null
		}),
		workDaysWorkSchedules: parse('workDaysWorkSchedules', (r, s, n, e) => {
			const workDaysId = integerValue(r.workDaysId, s, n, 'workDaysId', e), workScheduleId = textValue(r.workScheduleId, s, n, 'workScheduleId', e, true)
			return workDaysId !== null && workScheduleId ? { workDaysId, workScheduleId } : null
		}),
		workScheduleDayOverrides: parse('workScheduleDayOverrides', (r, s, n, e) => {
			const id = textValue(r.id, s, n, 'id', e, true), workScheduleId = textValue(r.workScheduleId, s, n, 'workScheduleId', e, true), dayOfWeek = integerValue(r.dayOfWeek, s, n, 'dayOfWeek', e), startTime = textValue(r.startTime, s, n, 'startTime', e), endTime = textValue(r.endTime, s, n, 'endTime', e)
			if (dayOfWeek !== null && (dayOfWeek < 0 || dayOfWeek > 6)) e.push({ sheet: s, row: n, field: 'dayOfWeek', message: 'Use 0 a 6.' })
			return id && workScheduleId && dayOfWeek !== null ? { id, workScheduleId, dayOfWeek, startTime, endTime } : null
		}),
		timeEntryJustifications: parse('timeEntryJustifications', (r, s, n, e) => {
			const id = textValue(r.id, s, n, 'id', e, true), type = textValue(r.type, s, n, 'type', e, true), category = textValue(r.category, s, n, 'category', e, true), description = textValue(r.description, s, n, 'description', e), createdAt = dateValue(r.createdAt, s, n, 'createdAt', e, true), employeeId = textValue(r.employeeId, s, n, 'employeeId', e, true), timeEntryId = textValue(r.timeEntryId, s, n, 'timeEntryId', e, true), approvedById = textValue(r.approvedById, s, n, 'approvedById', e, true)
			if (type && !['LATE_ARRIVAL', 'EARLY_DEPARTURE'].includes(type)) e.push({ sheet: s, row: n, field: 'type', message: 'Tipo de justificativa inválido.' })
			if (category && category !== 'MEDICAL_EMERGENCY') e.push({ sheet: s, row: n, field: 'category', message: 'Categoria inválida.' })
			return id && type && category && createdAt && employeeId && timeEntryId && approvedById ? { id, type, category, description, createdAt, employeeId, timeEntryId, approvedById } : null
		}),
		employeePushSubscriptions: parse('employeePushSubscriptions', (r, s, n, e) => {
			const id = textValue(r.id, s, n, 'id', e, true), endpoint = textValue(r.endpoint, s, n, 'endpoint', e, true), p256dh = textValue(r.p256dh, s, n, 'p256dh', e, true), auth = textValue(r.auth, s, n, 'auth', e, true), createdAt = dateValue(r.createdAt, s, n, 'createdAt', e, true), employeeId = textValue(r.employeeId, s, n, 'employeeId', e, true)
			return id && endpoint && p256dh && auth && createdAt && employeeId ? { id, endpoint, p256dh, auth, createdAt, employeeId } : null
		}),
		timeClockNotificationDeliveries: parse('timeClockNotificationDeliveries', (r, s, n, e) => {
			const id = textValue(r.id, s, n, 'id', e, true), employeeId = textValue(r.employeeId, s, n, 'employeeId', e, true), dateKey = textValue(r.dateKey, s, n, 'dateKey', e, true), kind = textValue(r.kind, s, n, 'kind', e, true), sentAt = dateValue(r.sentAt, s, n, 'sentAt', e, true)
			return id && employeeId && dateKey && kind && sentAt ? { id, employeeId, dateKey, kind, sentAt } : null
		}),
	}

	validateDataset(data, issues)
	return { data: issues.length ? null : data, issues }
}

function validateDataset(data: Dataset, issues: ImportIssue[]): void {
	const duplicate = (rows: DataRow[], field: string, sheet: string) => {
		const seen = new Set<unknown>()
		rows.forEach((row, index) => {
			const value = row[field]
			if (seen.has(value)) issues.push({ sheet, row: index + 2, field, message: `Valor duplicado: ${String(value)}.` })
			seen.add(value)
		})
	}
	for (const [key, definition] of Object.entries(SHEETS) as [keyof typeof SHEETS, (typeof SHEETS)[keyof typeof SHEETS]][]) duplicate(data[key], 'id', definition.name)
	duplicate(data.employees, 'username', SHEETS.employees.name)
	duplicate(data.timeBalances, 'employeeId', SHEETS.timeBalances.name)
	duplicate(data.workSchedules, 'employeeId', SHEETS.workSchedules.name)
	duplicate(data.employeePushSubscriptions, 'endpoint', SHEETS.employeePushSubscriptions.name)
	const duplicateCombination = (rows: DataRow[], fields: string[], sheet: string) => {
		const seen = new Set<string>()
		rows.forEach((row, index) => {
			const key = fields.map((field) => String(row[field])).join('\u0000')
			if (seen.has(key)) issues.push({ sheet, row: index + 2, field: fields.join(', '), message: 'Combinação duplicada.' })
			seen.add(key)
		})
	}
	duplicateCombination(data.workScheduleDayOverrides, ['workScheduleId', 'dayOfWeek'], SHEETS.workScheduleDayOverrides.name)
	duplicateCombination(data.timeEntryJustifications, ['timeEntryId', 'type'], SHEETS.timeEntryJustifications.name)
	duplicateCombination(data.workDaysWorkSchedules, ['workDaysId', 'workScheduleId'], SHEETS.workDaysWorkSchedules.name)
	duplicateCombination(data.timeClockNotificationDeliveries, ['employeeId', 'dateKey', 'kind'], SHEETS.timeClockNotificationDeliveries.name)
	const has = (rows: DataRow[], field: string, value: unknown) => rows.some((row) => row[field] === value)
	const refs: [keyof Dataset, string, keyof Dataset, string, string][] = [
		['timeEntries', 'employeeId', 'employees', 'id', 'employeeId'],
		['timeBalances', 'employeeId', 'employees', 'id', 'employeeId'],
		['timeBalanceEntries', 'employeeId', 'employees', 'id', 'employeeId'],
		['timeBalanceEntries', 'timeBalanceId', 'timeBalances', 'id', 'timeBalanceId'],
		['timeBalanceEntries', 'timeEntryId', 'timeEntries', 'id', 'timeEntryId'],
		['workSchedules', 'employeeId', 'employees', 'id', 'employeeId'],
		['workDaysWorkSchedules', 'workDaysId', 'workDays', 'id', 'workDaysId'],
		['workDaysWorkSchedules', 'workScheduleId', 'workSchedules', 'id', 'workScheduleId'],
		['workScheduleDayOverrides', 'workScheduleId', 'workSchedules', 'id', 'workScheduleId'],
		['timeEntryJustifications', 'employeeId', 'employees', 'id', 'employeeId'],
		['timeEntryJustifications', 'approvedById', 'employees', 'id', 'approvedById'],
		['timeEntryJustifications', 'timeEntryId', 'timeEntries', 'id', 'timeEntryId'],
		['employeePushSubscriptions', 'employeeId', 'employees', 'id', 'employeeId'],
		['timeClockNotificationDeliveries', 'employeeId', 'employees', 'id', 'employeeId'],
	]
	for (const [sourceKey, sourceField, targetKey, targetField, label] of refs) {
		const sheetName = SHEETS[sourceKey].name
		data[sourceKey].forEach((row, index) => {
			const value = row[sourceField]
			if (value !== null && value !== undefined && value !== '' && !has(data[targetKey], targetField, value)) issues.push({ sheet: sheetName, row: index + 2, field: label, message: `Referência não encontrada: ${String(value)}.` })
		})
	}
}

export async function importBackupWorkbook(prisma: any, data: Dataset): Promise<void> {
	await prisma.$transaction(async (tx: any) => {
		for (const row of data.employees) {
			const existing = await tx.employee.findUnique({ where: { id: row.id } })
			const { password, ...employee } = row
			if (existing) {
				await tx.employee.update({ where: { id: row.id }, data: { ...employee, ...(password ? { password } : {}) } })
			} else {
				const inaccessiblePasswordHash = password ?? await hashPassword(randomBytes(32).toString('hex'), 8)
				await tx.employee.create({ data: { ...employee, password: inaccessiblePasswordHash } })
			}
		}
		for (const row of data.workDays) await tx.workDays.upsert({ where: { id: row.id }, create: row, update: row })
		for (const row of data.timeEntries) await tx.timeEntry.upsert({ where: { id: row.id }, create: row, update: row })
		for (const row of data.timeBalances) await tx.timeBalance.upsert({ where: { id: row.id }, create: row, update: row })
		for (const row of data.workSchedules) await tx.workSchedule.upsert({ where: { id: row.id }, create: row, update: row })
		for (const row of data.workDaysWorkSchedules) await tx.workDaysWorkSchedule.upsert({ where: { workDaysId_workScheduleId: { workDaysId: row.workDaysId, workScheduleId: row.workScheduleId } }, create: row, update: {} })
		for (const row of data.workScheduleDayOverrides) await tx.workScheduleDayOverride.upsert({ where: { id: row.id }, create: row, update: row })
		for (const row of data.timeBalanceEntries) await tx.timeBalanceEntry.upsert({ where: { id: row.id }, create: row, update: row })
		for (const row of data.timeEntryJustifications) await tx.timeEntryJustification.upsert({ where: { id: row.id }, create: row, update: row })
		for (const row of data.employeePushSubscriptions) await tx.employeePushSubscription.upsert({ where: { id: row.id }, create: row, update: row })
		for (const row of data.timeClockNotificationDeliveries) await tx.timeClockNotificationDelivery.upsert({ where: { id: row.id }, create: row, update: row })
	}, { maxWait: 30_000, timeout: 120_000 })
}

export async function validateBackupDatasetAgainstDatabase(prisma: any, data: Dataset): Promise<ImportIssue[]> {
	const issues: ImportIssue[] = []
	const [employees, balances, schedules, subscriptions, overrides, justifications, deliveries] = await Promise.all([
		prisma.employee.findMany({ select: { id: true, username: true } }),
		prisma.timeBalance.findMany({ select: { id: true, employeeId: true } }),
		prisma.workSchedule.findMany({ select: { id: true, employeeId: true } }),
		prisma.employeePushSubscription.findMany({ select: { id: true, endpoint: true } }),
		prisma.workScheduleDayOverride.findMany({ select: { id: true, workScheduleId: true, dayOfWeek: true } }),
		prisma.timeEntryJustification.findMany({ select: { id: true, timeEntryId: true, type: true } }),
		prisma.timeClockNotificationDelivery.findMany({ select: { id: true, employeeId: true, dateKey: true, kind: true } }),
	])
	const conflict = (rows: DataRow[], current: DataRow[], uniqueField: string, sheet: string, currentUniqueField = uniqueField) => {
		const existingByUnique = new Map(current.map((row) => [row[currentUniqueField], row.id]))
		rows.forEach((row, index) => {
			const existingId = existingByUnique.get(row[uniqueField])
			if (existingId !== undefined && existingId !== row.id) issues.push({ sheet, row: index + 2, field: uniqueField, message: `Este valor já pertence ao registro ${String(existingId)} no banco.` })
		})
	}
	conflict(data.employees, employees, 'username', SHEETS.employees.name)
	conflict(data.timeBalances, balances, 'employeeId', SHEETS.timeBalances.name)
	conflict(data.workSchedules, schedules, 'employeeId', SHEETS.workSchedules.name)
	conflict(data.employeePushSubscriptions, subscriptions, 'endpoint', SHEETS.employeePushSubscriptions.name)
	const conflictComposite = (rows: DataRow[], current: DataRow[], fields: string[], sheet: string) => {
		const existing = new Map(current.map((row) => [fields.map((field) => String(row[field])).join('\u0000'), row.id]))
		rows.forEach((row, index) => {
			const key = fields.map((field) => String(row[field])).join('\u0000')
			const existingId = existing.get(key)
			if (existingId !== undefined && existingId !== row.id) issues.push({ sheet, row: index + 2, field: fields.join(', '), message: `Esta combinação já pertence ao registro ${String(existingId)} no banco.` })
		})
	}
	conflictComposite(data.workScheduleDayOverrides, overrides, ['workScheduleId', 'dayOfWeek'], SHEETS.workScheduleDayOverrides.name)
	conflictComposite(data.timeEntryJustifications, justifications, ['timeEntryId', 'type'], SHEETS.timeEntryJustifications.name)
	conflictComposite(data.timeClockNotificationDeliveries, deliveries, ['employeeId', 'dateKey', 'kind'], SHEETS.timeClockNotificationDeliveries.name)
	for (const row of data.employees) {
		const byId = employees.find((employee: DataRow) => employee.id === row.id)
		if (byId && byId.username !== row.username) issues.push({ sheet: SHEETS.employees.name, row: data.employees.indexOf(row) + 2, field: 'username', message: `O ID já pertence ao usuário ${String(byId.username)} no banco.` })
	}
	return issues
}

export const backupWorkbookFormatVersion = FORMAT_VERSION
