# Sistema de Ponto Digital — Casos de Uso

## 1. Autenticação e Conta
- [ ] O usuário deve conseguir se autenticar.
- [ ] O usuário deve conseguir trocar sua senha.

## 2. Registro de Ponto
- [x] O usuário deve conseguir registrar sua chegada.
- [x] O usuário deve conseguir registrar o início da pausa.
- [x] O usuário deve conseguir registrar o fim da pausa.
- [x] O usuário deve conseguir registrar sua saída.
- [x] O usuário deve conseguir visualizar seu histórico de marcações.
      ### Request 
        - Paginação;
        - Filtro por: período, tipo de evento
      ### Response
        - Tipo do evento: Entrada, pausa, saída;
        - Data e hora do evento;
        - Se for entrada, exibir estatística de atrasado ou se entrou adiantado;
        - Se for saída, exibir estatística de se saindo cedo ou se saiu depois;

- [ ] O usuário deve conseguir solicitar a correção de uma marcação incorreta.

## 3. Consulta e Exportação de Registros
- [ ] O usuário deve conseguir consultar seus registros por dia, semana, mês e ano
- [ ] O usuário deve conseguir exportar seus registros para uma planilha.
- [ ] O usuário deve conseguir visualizar seu espelho de ponto, incluindo a jornada prevista, as marcações realizadas e o total de horas trabalhadas.

## 4. Jornada de Trabalho
- [x] O usuário deve conseguir consultar sua jornada de trabalho prevista.
- [x] O usuário deve conseguir configurar seus horários de chegada, pausa e saída, conforme suas permissões.
- [x] O usuário deve conseguir editar sua jornada de trabalho, conforme suas permissões.

## 5. Métricas e Banco de Horas
- [x] O usuário deve conseguir consultar o tempo acumulado em atrasos.
- [x] O usuário deve conseguir consultar seu saldo de horas, incluindo créditos e débitos.
- [x] O usuário deve conseguir consultar o histórico de movimentações do banco de horas.
- [x] O usuário deve conseguir consultar as compensações de horas realizadas.
- [ ] O usuário deve conseguir registrar uma compensação de horas, conforme suas permissões.

## 6. Administração e Gestão
- [x] O administrador deve conseguir cadastrar e gerenciar funcionários.
- [x] O administrador deve conseguir configurar as jornadas de trabalho dos funcionários.
- [ ] O gestor deve conseguir consultar os registros de ponto dos funcionários sob sua responsabilidade, caso esse perfil seja implementado.
- [ ] O administrador deve conseguir configurar as políticas de tolerância e apuração de horas.
- [ ] O sistema deve manter um histórico de alterações nos registros de ponto, incluindo responsável, data e motivo.

## 7. Controle de Acesso e Permissões
- [ ] O sistema deve permitir a definição de diferentes perfis de usuário.
- [ ] O administrador deve conseguir atribuir perfis aos usuários.
- [ ] O sistema deve restringir funcionalidades e operações conforme as permissões do perfil do usuário.
- [ ] O sistema deve impedir que usuários acessem registros de funcionários sem autorização.
- [ ] O sistema deve permitir que usuários com permissão administrativa gerenciem as permissões de outros usuários.
- [ ] O sistema deve validar as permissões no backend e aplicar as restrições correspondentes no frontend.

### Perfis iniciais sugeridos

- **Administrador (`ADMIN`):** gerencia funcionários, jornadas, perfis e permissões.
- **Funcionário (`EMPLOYEE`):** registra o próprio ponto, consulta seus registros, acompanha métricas e gerencia sua conta dentro das permissões concedidas.

---

# Regras de Negócio

## 1. Usuários
- [x] Só pode existir um usuário com o mesmo `username`.
- [x] Cada usuário deve possuir um perfil de acesso que determine suas permissões.
- [x] O usuário só pode consultar seus próprios registros de ponto, salvo quando possuir permissão para consultar registros de terceiros.
- [x] Somente usuários autorizados podem cadastrar, editar ou desativar outros usuários.
- [x] A senha deve ser armazenada de forma segura, utilizando hash, nunca em texto puro.
- [ ] Um usuário inativo não pode se autenticar nem registrar pontos.

## 2. Jornada de Trabalho
- [x] Cada funcionário deve possuir uma jornada de trabalho definida.
- [x] A jornada deve definir os horários previstos de entrada, início e fim da pausa e saída.
- [x] A jornada deve permitir a configuração dos dias de trabalho e descanso.
- [x] As alterações na jornada não devem modificar retroativamente os cálculos de períodos já encerrados.
- [x] O sistema deve considerar a jornada vigente na data de cada registro para calcular atrasos e saldo de horas.
- [ ] A ausência de uma jornada configurada deve impedir cálculos automáticos de atrasos e saldo de horas até que exista uma regra aplicável.
- [ ] A jornada deve permitir configurar as tolerâncias aplicáveis aos registros, conforme a política da empresa.

## 3. Registros de Ponto
- [x] Cada marcação deve estar vinculada a um único funcionário.
- [x] Cada marcação deve registrar data e hora.
- [x] O funcionário deve seguir uma sequência válida de marcações: entrada, início da pausa, fim da pausa e saída.
- [x] Não deve ser permitido registrar uma saída antes da entrada.
- [x] Não deve ser permitido iniciar uma pausa sem uma jornada iniciada.
- [x] Não deve ser permitido encerrar uma pausa sem que ela tenha sido iniciada.
- [x] Não deve ser permitido registrar uma segunda entrada enquanto a jornada anterior estiver aberta.
- [x] Uma jornada só pode ser encerrada após a entrada e o encerramento de uma pausa que tenha sido iniciada.
- [x] O sistema deve impedir marcações incompatíveis com o estado atual da jornada.
- [x] Os registros originais de ponto não devem ser excluídos ou alterados silenciosamente.
- [x] Toda correção deve registrar o responsável, a data, o motivo e os valores anteriores e posteriores.
- [x] O sistema deve armazenar e apresentar os registros de acordo com o fuso horário aplicável.

## 4. Cálculo de Horas
- [x] O tempo trabalhado deve ser calculado a partir das marcações válidas de entrada, pausa, retorno e saída.
- [ ] Os intervalos de pausa não devem ser contabilizados como horas trabalhadas quando não forem remunerados conforme as regras aplicáveis.
- [ ] Os atrasos devem ser calculados comparando a entrada registrada com o horário previsto na jornada vigente.
- [ ] As horas excedentes devem ser calculadas com base na jornada prevista e nas regras de apuração configuradas.
- [ ] O sistema deve permitir configurar tolerâncias para atrasos na entrada e variações nos demais horários.
- [ ] A tolerância deve ser configurável por jornada ou por política da empresa.
- [ ] A tolerância não deve alterar o horário original registrado na marcação.
- [ ] O sistema deve aplicar as regras de tolerância antes de gerar créditos ou débitos no banco de horas.
- [ ] O tempo trabalhado antes do início ou após o término da jornada só deve gerar crédito quando atender às regras de contabilização configuradas.
- [ ] Uma jornada sem saída registrada deve ser considerada incompleta e não deve ser tratada automaticamente como encerrada.
- [ ] O sistema deve identificar dias sem marcações, jornadas incompletas e inconsistências nos registros.

## 5. Banco de Horas e Compensações
- [ ] Cada funcionário deve possuir um saldo de horas consolidado, representado por `WorkBalance`.
- [ ] O saldo deve refletir os créditos, débitos e compensações contabilizados.
- [ ] Cada alteração no saldo deve gerar uma movimentação registrada em `WorkBalanceEntry`.
- [ ] Cada movimentação deve identificar seu tipo (`CREDIT` ou `DEBIT`), motivo, quantidade de minutos e data de criação.
- [ ] As movimentações devem possuir uma origem identificável sempre que forem geradas por uma marcação ou jornada.
- [ ] Uma mesma marcação ou jornada não pode gerar a mesma movimentação mais de uma vez.
- [ ] Ao encerrar uma jornada, o sistema deve calcular o resultado da apuração e registrar as movimentações correspondentes.
- [ ] Débitos de horas devem reduzir o saldo disponível do funcionário.
- [ ] Créditos de horas devem reduzir débitos existentes antes de gerar saldo positivo, conforme a política de apuração configurada.
- [ ] Caso o crédito seja superior ao débito existente, o excedente deve compor o saldo positivo.
- [ ] Toda compensação deve estar vinculada ao funcionário e à movimentação ou saldo que está sendo compensado.
- [ ] Uma compensação não pode ser contabilizada mais de uma vez.
- [ ] A compensação deve gerar uma movimentação rastreável no banco de horas.
- [ ] O sistema deve manter o histórico de créditos, débitos e compensações.
- [ ] O saldo consolidado deve ser consistente com o histórico de movimentações.

## 6. Permissões e Segurança
- [ ] Cada operação deve ser autorizada no backend de acordo com o perfil e as permissões do usuário.
- [ ] Um funcionário não pode registrar ponto em nome de outro funcionário sem autorização específica.
- [ ] Somente usuários autorizados podem aprovar correções de ponto.
- [ ] Somente usuários autorizados podem alterar jornadas de trabalho e políticas de apuração.
- [ ] Toda operação administrativa relevante deve gerar um registro de auditoria.
- [ ] A desativação de um funcionário não deve excluir seu histórico de ponto ou banco de horas.

## 7. Consultas e Exportações
- [ ] As consultas devem respeitar as permissões de acesso aos registros.
- [ ] Os filtros por dia, semana, mês e ano devem considerar o período selecionado.
- [ ] Os totais exibidos nos relatórios devem ser consistentes com os cálculos utilizados pelo sistema.
- [ ] As exportações devem respeitar os mesmos filtros e permissões da consulta original.
- [ ] Os relatórios devem distinguir marcações realizadas, correções, horas trabalhadas, atrasos, créditos, débitos e compensações.

---

# Observações de Modelagem

- `Employee`: representa o funcionário.
- `TimeEntry`: representa uma marcação individual de ponto.
- `WorkSchedule`: representa a jornada de trabalho prevista.
- `TimeCompensation`: representa uma compensação de horas.
- `WorkBalance`: representa o saldo consolidado de horas do funcionário.
- `WorkBalanceEntry`: representa uma movimentação individual de crédito ou débito.
- `Timesheet`: representa o espelho ou consolidado de ponto de um período.

**Nota:** o `WorkBalance` deve manter o saldo consolidado, enquanto o `WorkBalanceEntry` registra o histórico das movimentações que formam esse saldo. A compensação de horas deve ser rastreável e não deve gerar créditos ou débitos duplicados.