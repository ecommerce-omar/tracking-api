/**
 * ROTAS DE TEMPLATES DE EMAIL - PRESENTATION LAYER
 *
 * Define as rotas HTTP para gerenciamento de templates de email.
 * Permite operações CRUD completas em templates armazenados no banco de dados.
 *
 * Endpoints disponíveis:
 * - GET / - Lista todos os templates ativos
 * - GET /:name - Busca template por nome
 * - POST / - Cria novo template
 * - PUT /:id - Atualiza template existente
 * - DELETE /:id - Remove template
 * - POST /:name/test - Envia email de teste usando template
 *
 * Responsabilidades:
 * - Mapear operações CRUD para funções de serviço
 * - Validar dados de entrada usando schemas Zod
 * - Retornar respostas HTTP apropriadas
 * - Tratar erros de forma consistente
 *
 * Padrões aplicados:
 * - Router Pattern (Express)
 * - RESTful API Design
 * - Input Validation (Zod)
 * - Error Handling
 */

import { Router } from "express";
import {
  getAllTemplates,
  getTemplate,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  EmailTemplate
} from "../services/templates";
import { sendTestEmail } from "../middlewares/emailSender";
import { emailTemplateSchema, updateEmailTemplateSchema, testEmailSchema } from "../schemas/templateSchema";

const router = Router();

/**
 * GET /
 * Lista todos os templates de email ativos
 */
router.get("/", async (req, res) => {
  try {
    const templates = await getAllTemplates();
    res.json(templates);
  } catch (error) {
    console.error("Erro ao listar templates:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

/**
 * GET /:name
 * Busca um template específico pelo nome
 * Exemplo: GET /templates/tracking_status_changed
 */
router.get("/:name", async (req, res) => {
  try {
    const { name } = req.params;
    const template = await getTemplate(name);
    res.json(template);
  } catch (error) {
    console.error("Erro ao buscar template:", error);
    res.status(404).json({ error: "Template não encontrado" });
  }
});

/**
 * POST /
 * Cria um novo template de email
 * Body: { name, subject, body_html, body_text, variables, category, is_active }
 */
router.post("/", async (req, res) => {
  try {
    // Validar dados de entrada com Zod
    const validation = emailTemplateSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ 
        error: "Dados de entrada inválidos",
        details: validation.error.issues.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      });
    }

    const template = await createTemplate(validation.data);
    res.status(201).json(template);
  } catch (error) {
    console.error("Erro ao criar template:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

/**
 * PUT /:id
 * Atualiza um template existente
 * Body: Campos a serem atualizados (parcial)
 */
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    // Validar dados de atualização
    const validation = updateEmailTemplateSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({ 
        error: "Dados de entrada inválidos",
        details: validation.error.issues.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      });
    }

    const template = await updateTemplate(id, validation.data);
    res.json(template);
  } catch (error) {
    console.error("Erro ao atualizar template:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

/**
 * DELETE /:id
 * Remove um template do sistema
 */
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await deleteTemplate(id);
    res.status(204).send();
  } catch (error) {
    console.error("Erro ao deletar template:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

/**
 * POST /:name/test
 * Envia um email de teste usando o template especificado
 * Body: { email } - Email de destino para o teste
 */
router.post("/:name/test", async (req, res) => {
  try {
    const { name } = req.params;
    // Validar email de destino
    const validation = testEmailSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({ 
        error: "Dados de entrada inválidos",
        details: validation.error.issues.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      });
    }

    const { email } = validation.data;

    // Enviar email de teste
    await sendTestEmail(email, name);
    res.json({ message: `Email de teste enviado para ${email} usando template ${name}` });
  } catch (error) {
    console.error("Erro ao enviar email de teste:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

export default router;
