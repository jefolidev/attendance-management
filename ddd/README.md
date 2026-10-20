# Sistema de Ponto Digital — Casos de Uso

## 1. Autenticação e Conta
- [ ] O usuário deve conseguir se autenticar.
- [ ] O usuário deve conseguir trocar sua senha.

## 2. Registro de Ponto
- [ ] O usuário deve conseguir registrar sua chegada.
- [ ] O usuário deve conseguir registrar o início da pausa.
- [ ] O usuário deve conseguir registrar o fim da pausa.
- [ ] O usuário deve conseguir registrar sua saída.
- [ ] O usuário deve conseguir visualizar seu histórico de marcações.
- [ ] O usuário deve conseguir solicitar a correção de uma marcação incorreta.

## 3. Consulta e Exportação de Registros
- [ ] O usuário deve conseguir consultar seus registros por dia, semana, mês e ano.
- [ ] O usuário deve conseguir exportar seus registros para uma planilha.
- [ ] O usuário deve conseguir visualizar seu espelho de ponto, incluindo a jornada prevista, as marcações realizadas e o total de horas trabalhadas.

## 4. Jornada de Trabalho
- [ ] O usuário deve conseguir consultar sua jornada de trabalho prevista.
- [ ] O usuário deve conseguir configurar seus horários de chegada, pausa e saída.
- [ ] O usuário deve conseguir editar sua jornada de trabalho.

## 5. Métricas e Banco de Horas
- [ ] O usuário deve conseguir consultar o tempo acumulado em atrasos.
- [ ] O usuário deve conseguir consultar seu saldo de horas, incluindo horas devidas e horas extras.
- [ ] O usuário deve conseguir registrar a compensação de horas devidas.
- [ ] O usuário deve conseguir consultar o histórico de compensações de horas.
- [ ] O usuário deve conseguir registrar pagamentos de horas extras.
- [ ] O usuário deve conseguir consultar o histórico de pagamentos de horas extras.

## 6. Administração e Gestão
- [ ] O administrador deve conseguir cadastrar e gerenciar funcionários.
- [ ] O administrador deve conseguir configurar as jornadas de trabalho dos funcionários.
- [ ] O gestor deve conseguir consultar os registros de ponto dos funcionários sob sua responsabilidade.
- [ ] O sistema deve manter um histórico de alterações nos registros de ponto, incluindo responsável, data e motivo.

## 7. Controle de Acesso e Permissões
- [ ] O sistema deve permitir a definição de diferentes perfis de usuário.
- [ ] O administrador deve conseguir atribuir perfis aos usuários.
- [ ] O sistema deve restringir funcionalidades e operações conforme as permissões do perfil do usuário.
- [ ] O sistema deve impedir que usuários acessem registros de funcionários sem autorização.
- [ ] O sistema deve permitir que usuários com permissão administrativa gerenciem as permissões de outros usuários.
- [ ] O sistema deve validar as permissões tanto no frontend quanto no backend.

### Perfis iniciais sugeridos

- **Administrador (`ADMIN`):** gerencia funcionários, jornadas, perfis e permissões.
- **Funcionário (`EMPLOYEE`):** registra o próprio ponto, consulta seus registros, acompanha métricas e gerencia sua conta dentro das permissões concedidas.

# Regras de Negócio

## Usuários

- [ ] Só pode existir um usuário com o mesmo `username`.
- [ ] Cada usuário deve possuir um perfil de acesso que determine suas permissões.
- [ ] O usuário só pode consultar seus próprios registros de ponto, salvo quando possuir permissão para consultar registros de terceiros.
- [ ] Somente usuários autorizados podem cadastrar, editar ou desativar outros usuários.
- [ ] A senha deve ser armazenada de forma segura, utilizando hash, nunca em texto puro.

## Jornada de Trabalho

- [ ] Cada funcionário deve possuir uma jornada de trabalho definida.
- [ ] A jornada deve definir os horários previstos de entrada, início e fim da pausa e saída.
- [ ] As alterações na jornada não devem modificar retroativamente os cálculos de períodos já encerrados.
- [ ] A jornada deve permitir a configuração de dias úteis e dias de descanso.
- [ ] O sistema deve considerar a jornada vigente na data de cada registro para calcular atrasos e saldo de horas.
- [ ] A ausência de uma jornada configurada deve impedir cálculos automáticos de atrasos e horas devidas até que exista uma regra aplicável.

## Registros de Ponto

- [ ] Cada marcação deve estar vinculada a um único funcionário.
- [ ] Cada marcação deve registrar data e hora.
- [ ] O funcionário deve seguir uma sequência válida de marcações: entrada, início da pausa, fim da pausa e saída.
- [ ] Não deve ser permitido registrar uma saída antes da entrada.
- [ ] Não deve ser permitido iniciar uma pausa sem uma jornada iniciada.
- [ ] Não deve ser permitido encerrar uma pausa sem que ela tenha sido iniciada.
- [ ] Não deve ser permitido registrar uma segunda entrada enquanto a jornada anterior estiver aberta.
- [ ] Uma jornada só pode ser encerrada após a entrada e, quando aplicável, após o encerramento da pausa.
- [ ] O sistema deve impedir marcações duplicadas ou incompatíveis com o estado atual da jornada.
- [ ] Os registros originais de ponto não devem ser excluídos ou alterados silenciosamente.
- [ ] O sistema deve utilizar uma referência de data e hora consistente para armazenar os registros e apresentá-los no fuso horário aplicável.

## Cálculo de Horas

- [ ] O tempo trabalhado deve ser calculado a partir das marcações válidas de entrada, pausa, retorno e saída.
- [ ] Os intervalos de pausa não devem ser contabilizados como horas trabalhadas quando não forem remunerados conforme as regras aplicáveis.
- [ ] Os atrasos devem ser calculados comparando a entrada registrada com o horário previsto na jornada vigente.
- [ ] As horas extras devem ser calculadas com base na jornada prevista e nas regras de apuração configuradas.
- [ ] O saldo de horas deve considerar horas positivas, horas devidas e compensações registradas.
- [ ] Uma jornada sem saída registrada deve ser considerada incompleta e não deve ser tratada automaticamente como encerrada.
- [ ] O sistema deve permitir identificar dias sem marcações, jornadas incompletas e inconsistências nos registros.
- [ ] O sistema deve permitir configurar uma tolerância de minutos para atrasos na entrada e variações no horário de saída.
- [ ] A tolerância deve ser configurável por jornada de trabalho ou por política da empresa.
- [ ] A entrada realizada dentro da tolerância de atraso não deve gerar débito de horas.
- [ ] A saída realizada dentro da tolerância de variação não deve gerar crédito ou débito de horas, salvo quando houver regra específica configurada.
- [ ] O tempo trabalhado antes do início ou após o término da jornada só deve gerar crédito quando atender às regras de contabilização configuradas.
- [ ] O sistema deve calcular os débitos e créditos considerando a tolerância aplicável, sem descartar períodos que devam ser contabilizados conforme as regras da empresa.
- [ ] A tolerância não deve alterar o horário original registrado na marcação de ponto.

## Banco de Horas e Compensações

- [ ] Toda compensação deve estar vinculada a um funcionário e a um saldo de horas existente.
- [ ] Uma compensação não pode descontar mais horas do que o saldo disponível para compensação.
- [ ] Cada compensação deve registrar a quantidade de horas, a data, o motivo e o responsável pelo lançamento.
- [ ] Uma compensação não pode ser contabilizada mais de uma vez.
- [ ] O pagamento de horas extras deve ser registrado separadamente da compensação de horas.
- [ ] Um pagamento não pode ser registrado como realizado sem a confirmação ou autorização exigida pelo sistema.
- [ ] O sistema deve manter o histórico das movimentações do banco de horas.
- [ ] Ao registrar a saída, o sistema deve calcular o saldo de horas da jornada, considerando o horário previsto e as regras de apuração configuradas.
- [ ] Caso exista saldo de horas em débito, o excedente trabalhado deve ser utilizado para reduzir esse saldo, até o limite das horas devidas.
- [ ] Caso o excedente trabalhado seja superior ao saldo devedor, as horas restantes devem ser adicionadas ao banco de horas positivo.
- [ ] Toda movimentação automática do banco de horas deve ser registrada no histórico, incluindo a quantidade de horas, o tipo de movimentação e a data.
- [ ] O sistema deve impedir que a mesma jornada gere movimentações duplicadas no banco de horas.

## Permissões e Segurança

- [ ] Cada operação deve ser autorizada no backend de acordo com o perfil e as permissões do usuário.
- [ ] Um funcionário não pode registrar ponto em nome de outro funcionário sem autorização específica.
- [ ] Toda operação administrativa relevante deve gerar um registro de auditoria.
- [ ] A desativação de um funcionário não deve excluir seu histórico de ponto.

## Consultas e Exportações

- [ ] As consultas devem respeitar as permissões de acesso aos registros.
- [ ] Os filtros por dia, semana, mês e ano devem considerar o período selecionado.
- [ ] Os totais exibidos nos relatórios devem ser consistentes com os cálculos utilizados pelo sistema.
- [ ] As exportações devem respeitar os mesmos filtros e permissões da consulta original.
- [ ] Os relatórios devem distinguir marcações realizadas, correções, horas trabalhadas, atrasos, horas extras e compensações.

## Observações de Modelagem

- `Employee`: representa o funcionário.
- `TimeEntry`: representa uma marcação individual de ponto.
- `WorkSchedule`: representa a jornada de trabalho prevista.
- `TimeCompensation`: representa a compensação de horas.
- `OvertimePayment`: representa o pagamento de horas extras.
- `Timesheet`: representa o espelho ou consolidado de ponto de um período.

**Nota:** compensação de horas e pagamento de horas extras são operações distintas e devem possuir regras e registros próprios.

