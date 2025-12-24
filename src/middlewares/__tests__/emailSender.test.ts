import { sendTrackingEmail, sendTestEmail } from '../emailSender';
import { transporter } from '../../config/mail';
import { getTemplate } from '../../services/templates';

jest.mock('../../config/mail', () => ({
  transporter: {
    sendMail: jest.fn()
  }
}));

jest.mock('../../services/templates');

// Mock Handlebars to avoid actual compilation in tests
jest.mock('handlebars', () => ({
  compile: jest.fn((template: string) => {
    return (data: any) => {
      let result = template;

      // First, handle conditional blocks {{#if}}...{{/if}}
      // Extract all possible keys from both data and template
      const allKeys = new Set([
        ...Object.keys(data),
        ...Array.from(template.matchAll(/\{\{#if (\w+)\}\}/g)).map(m => m[1])
      ]);

      allKeys.forEach(key => {
        const value = data[key];
        if (value === undefined || value === null || value === '') {
          // Remove the entire conditional block
          const ifRegex = new RegExp(`\\{\\{#if ${key}\\}\\}.*?\\{\\{/if\\}\\}`, 'gs');
          result = result.replace(ifRegex, '');
        } else {
          // Remove only the {{#if}} and {{/if}} tags, keep content
          const ifOpenRegex = new RegExp(`\\{\\{#if ${key}\\}\\}`, 'g');
          result = result.replace(ifOpenRegex, '');
        }
      });

      // Remove any remaining {{/if}} tags
      result = result.replace(/\{\{\/if\}\}/g, '');

      // Then handle variable replacement
      Object.keys(data).forEach(key => {
        const value = data[key];
        if (value !== undefined && value !== null) {
          // Handle arrays (for {{#each}} blocks)
          if (Array.isArray(value)) {
            // Replace {{#each key}}{{this}}{{/each}} with array items
            const eachRegex = new RegExp(`\\{\\{#each ${key}\\}\\}.*?\\{\\{/each\\}\\}`, 'gs');
            result = result.replace(eachRegex, value.join(', '));
          } else {
            // Replace {{key}} with value
            const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
            result = result.replace(regex, String(value));
          }
        }
      });

      return result;
    };
  })
}));

describe('emailSender', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Limpa o console.log para evitar poluição nos testes
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('sendTrackingEmail', () => {
    const mockTemplate = {
      id: '1',
      name: 'Postado',
      subject: 'Pedido {{tracking_code}} - Postado',
      body_html: '<h1>Olá {{customer_name}}</h1><p>Produtos: {{products}}</p>',
      body_text: 'Olá {{customer_name}}, Produtos: {{products}}',
      variables: {
        customer_name: '{{customer_name}}',
        tracking_code: '{{tracking_code}}',
        products: '{{products}}'
      },
      category: 'tracking',
      is_active: true,
      created_at: '2025-10-03T00:00:00Z',
      updated_at: '2025-10-03T00:00:00Z'
    };

    it('deve enviar email com variáveis substituídas corretamente', async () => {
      (getTemplate as jest.Mock).mockResolvedValue(mockTemplate);
      (transporter.sendMail as jest.Mock).mockResolvedValue({ messageId: '123' });

      await sendTrackingEmail({
        customer_name: 'João Silva',
        email: 'joao@email.com',
        tracking_code: 'AB123456789BR',
        products: 'Produto A, Produto B',
        status: 'Objeto postado'
      });

      expect(getTemplate).toHaveBeenCalledWith('Postado');
      expect(transporter.sendMail).toHaveBeenCalledWith({
        from: expect.any(String),
        to: 'joao@email.com',
        subject: 'Pedido AB123456789BR - Postado',
        html: '<h1>Olá João Silva</h1><p>Produtos: Produto A, Produto B</p>',
        text: 'Olá João Silva, Produtos: Produto A, Produto B'
      });
    });

    it('deve mapear status completo dos Correios para template correto', async () => {
      (getTemplate as jest.Mock).mockResolvedValue(mockTemplate);
      (transporter.sendMail as jest.Mock).mockResolvedValue({ messageId: '123' });

      await sendTrackingEmail({
        customer_name: 'Maria',
        email: 'maria@email.com',
        tracking_code: 'AB987654321BR',
        products: 'Item X',
        status: 'Objeto postado' // Status completo dos Correios
      });

      // Deve buscar o template "Postado"
      expect(getTemplate).toHaveBeenCalledWith('Postado');
    });

    it('deve mapear "Objeto entregue ao destinatário" para template "Objeto entregue"', async () => {
      const deliveredTemplate = { ...mockTemplate, name: 'Objeto entregue' };
      (getTemplate as jest.Mock).mockResolvedValue(deliveredTemplate);
      (transporter.sendMail as jest.Mock).mockResolvedValue({ messageId: '123' });

      await sendTrackingEmail({
        customer_name: 'Carlos',
        email: 'carlos@email.com',
        tracking_code: 'AB111222333BR',
        products: 'Produto Z',
        status: 'Objeto entregue ao destinatário'
      });

      expect(getTemplate).toHaveBeenCalledWith('Objeto entregue');
    });

    it('deve mapear "Objeto saiu para entrega ao destinatário" para template "Saiu para entrega"', async () => {
      const outForDeliveryTemplate = { ...mockTemplate, name: 'Saiu para entrega' };
      (getTemplate as jest.Mock).mockResolvedValue(outForDeliveryTemplate);
      (transporter.sendMail as jest.Mock).mockResolvedValue({ messageId: '123' });

      await sendTrackingEmail({
        customer_name: 'Ana',
        email: 'ana@email.com',
        tracking_code: 'AB444555666BR',
        products: 'Item Y',
        status: 'Objeto saiu para entrega ao destinatário'
      });

      expect(getTemplate).toHaveBeenCalledWith('Saiu para entrega');
    });

    it('deve mapear "Objeto em transferência - por favor aguarde" para template "Em transferência"', async () => {
      const inTransitTemplate = { ...mockTemplate, name: 'Em transferência' };
      (getTemplate as jest.Mock).mockResolvedValue(inTransitTemplate);
      (transporter.sendMail as jest.Mock).mockResolvedValue({ messageId: '123' });

      await sendTrackingEmail({
        customer_name: 'Pedro',
        email: 'pedro@email.com',
        tracking_code: 'AB777888999BR',
        products: 'Produto W',
        status: 'Objeto em transferência - por favor aguarde'
      });

      expect(getTemplate).toHaveBeenCalledWith('Em transferência');
    });

    it('deve mapear "Objeto em correção de rota" para template "Em transferência"', async () => {
      const routeCorrectionTemplate = { ...mockTemplate, name: 'Em transferência' };
      (getTemplate as jest.Mock).mockResolvedValue(routeCorrectionTemplate);
      (transporter.sendMail as jest.Mock).mockResolvedValue({ messageId: '123' });

      await sendTrackingEmail({
        customer_name: 'Luiza',
        email: 'luiza@email.com',
        tracking_code: 'AB888999000BR',
        products: 'Produto V',
        status: 'Objeto em correção de rota'
      });

      expect(getTemplate).toHaveBeenCalledWith('Em transferência');
    });

    it('não deve enviar email se template não estiver ativo', async () => {
      const inactiveTemplate = { ...mockTemplate, is_active: false };
      (getTemplate as jest.Mock).mockResolvedValue(inactiveTemplate);

      await sendTrackingEmail({
        customer_name: 'José',
        email: 'jose@email.com',
        tracking_code: 'AB000111222BR',
        products: 'Item K',
        status: 'Objeto postado'
      });

      expect(transporter.sendMail).not.toHaveBeenCalled();
    });

    it('deve usar template "Postado" como fallback para status desconhecido', async () => {
      (getTemplate as jest.Mock).mockResolvedValue(mockTemplate);
      (transporter.sendMail as jest.Mock).mockResolvedValue({ messageId: '123' });

      await sendTrackingEmail({
        customer_name: 'Lucas',
        email: 'lucas@email.com',
        tracking_code: 'AB333444555BR',
        products: 'Produto M',
        status: 'Status Desconhecido Qualquer'
      });

      expect(getTemplate).toHaveBeenCalledWith('Postado');
    });

    it('deve lançar erro se envio falhar', async () => {
      (getTemplate as jest.Mock).mockResolvedValue(mockTemplate);
      (transporter.sendMail as jest.Mock).mockRejectedValue(new Error('SMTP Error'));

      await expect(sendTrackingEmail({
        customer_name: 'Fernanda',
        email: 'fernanda@email.com',
        tracking_code: 'AB666777888BR',
        products: 'Produto N',
        status: 'Objeto postado'
      })).rejects.toThrow('SMTP Error');
    });

    it('deve substituir múltiplas ocorrências da mesma variável', async () => {
      const templateWithMultipleVars = {
        ...mockTemplate,
        body_html: '<p>{{customer_name}} pediu {{products}}. Obrigado {{customer_name}}!</p>',
        body_text: '{{customer_name}} pediu {{products}}. Obrigado {{customer_name}}!'
      };
      (getTemplate as jest.Mock).mockResolvedValue(templateWithMultipleVars);
      (transporter.sendMail as jest.Mock).mockResolvedValue({ messageId: '123' });

      await sendTrackingEmail({
        customer_name: 'Roberto',
        email: 'roberto@email.com',
        tracking_code: 'AB999000111BR',
        products: 'Item Z',
        status: 'Objeto postado'
      });

      expect(transporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          html: '<p>Roberto pediu Item Z. Obrigado Roberto!</p>',
          text: 'Roberto pediu Item Z. Obrigado Roberto!'
        })
      );
    });
  });

  describe('sendTestEmail', () => {
    const mockTemplate = {
      id: '1',
      name: 'Postado',
      subject: 'Teste - {{tracking_code}}',
      body_html: '<h1>Olá {{customer_name}}</h1>',
      body_text: 'Olá {{customer_name}}',
      variables: {
        customer_name: '{{customer_name}}',
        tracking_code: '{{tracking_code}}',
        products: '{{products}}'
      },
      category: 'tracking',
      is_active: true,
      created_at: '2025-10-03T00:00:00Z',
      updated_at: '2025-10-03T00:00:00Z'
    };

    it('deve enviar email de teste com dados mockados', async () => {
      (getTemplate as jest.Mock).mockResolvedValue(mockTemplate);
      (transporter.sendMail as jest.Mock).mockResolvedValue({ messageId: '123' });

      await sendTestEmail('teste@email.com', 'Postado');

      expect(getTemplate).toHaveBeenCalledWith('Postado');
      expect(transporter.sendMail).toHaveBeenCalledWith({
        from: expect.any(String),
        to: 'teste@email.com',
        subject: 'Teste - AA123456789BR',
        html: '<h1>Olá Cliente Teste</h1>',
        text: 'Olá Cliente Teste'
      });
    });

    it('deve lançar erro se template não existir', async () => {
      (getTemplate as jest.Mock).mockRejectedValue(new Error('Template não encontrado'));

      await expect(sendTestEmail('teste@email.com', 'TemplateInexistente'))
        .rejects.toThrow('Template não encontrado');
    });
  });

  describe('Handlebars features', () => {
    describe('condicionais', () => {
      it('deve renderizar conteúdo condicional quando variável existe', async () => {
        const templateWithConditional = {
          id: '1',
          name: 'Não entregue',
          subject: 'Pedido não entregue',
          body_html: '<p>Status: {{status}}</p>{{#if detail}}<p>Motivo: {{detail}}</p>{{/if}}',
          body_text: 'Status: {{status}}{{#if detail}} Motivo: {{detail}}{{/if}}',
          variables: {
            status: '{{status}}',
            detail: '{{detail}}'
          },
          category: 'tracking',
          is_active: true,
          created_at: '2025-10-03T00:00:00Z',
          updated_at: '2025-10-03T00:00:00Z'
        };

        (getTemplate as jest.Mock).mockResolvedValue(templateWithConditional);
        (transporter.sendMail as jest.Mock).mockResolvedValue({ messageId: '123' });

        await sendTrackingEmail({
          customer_name: 'João',
          email: 'joao@email.com',
          tracking_code: 'AB123456789BR',
          products: 'Produto A',
          status: 'Objeto não entregue',
          detail: 'Endereço incorreto'
        });

        expect(transporter.sendMail).toHaveBeenCalledWith(
          expect.objectContaining({
            html: '<p>Status: Objeto não entregue</p><p>Motivo: Endereço incorreto</p>',
            text: 'Status: Objeto não entregue Motivo: Endereço incorreto'
          })
        );
      });

      it('deve omitir conteúdo condicional quando variável não existe', async () => {
        const templateWithConditional = {
          id: '1',
          name: 'Postado',
          subject: 'Pedido postado',
          body_html: '<p>Status: {{status}}</p>{{#if detail}}<p>Motivo: {{detail}}</p>{{/if}}',
          body_text: 'Status: {{status}}{{#if detail}} Motivo: {{detail}}{{/if}}',
          variables: {
            status: '{{status}}',
            detail: '{{detail}}'
          },
          category: 'tracking',
          is_active: true,
          created_at: '2025-10-03T00:00:00Z',
          updated_at: '2025-10-03T00:00:00Z'
        };

        (getTemplate as jest.Mock).mockResolvedValue(templateWithConditional);
        (transporter.sendMail as jest.Mock).mockResolvedValue({ messageId: '123' });

        await sendTrackingEmail({
          customer_name: 'Maria',
          email: 'maria@email.com',
          tracking_code: 'AB987654321BR',
          products: 'Produto B',
          status: 'Objeto postado'
          // detail não fornecido
        });

        expect(transporter.sendMail).toHaveBeenCalledWith(
          expect.objectContaining({
            html: '<p>Status: Objeto postado</p>',
            text: 'Status: Objeto postado'
          })
        );
      });
    });

    describe('loops com arrays', () => {
      it('deve renderizar array de produtos usando {{#each}}', async () => {
        const templateWithLoop = {
          id: '1',
          name: 'Entregue',
          subject: 'Pedido entregue',
          body_html: '<h1>Produtos:</h1><ul>{{#each products}}<li>{{this}}</li>{{/each}}</ul>',
          body_text: 'Produtos: {{#each products}}{{this}}{{/each}}',
          variables: {
            products: '{{products}}'
          },
          category: 'tracking',
          is_active: true,
          created_at: '2025-10-03T00:00:00Z',
          updated_at: '2025-10-03T00:00:00Z'
        };

        (getTemplate as jest.Mock).mockResolvedValue(templateWithLoop);
        (transporter.sendMail as jest.Mock).mockResolvedValue({ messageId: '123' });

        await sendTrackingEmail({
          customer_name: 'Carlos',
          email: 'carlos@email.com',
          tracking_code: 'AB111222333BR',
          products: ['Notebook', 'Mouse', 'Teclado'],
          status: 'Objeto entregue'
        });

        expect(transporter.sendMail).toHaveBeenCalledWith(
          expect.objectContaining({
            html: '<h1>Produtos:</h1><ul>Notebook, Mouse, Teclado</ul>',
            text: 'Produtos: Notebook, Mouse, Teclado'
          })
        );
      });

      it('deve suportar produtos como string (retrocompatibilidade)', async () => {
        const templateWithLoop = {
          id: '1',
          name: 'Entregue',
          subject: 'Pedido entregue',
          body_html: '<p>Produtos: {{products}}</p>',
          body_text: 'Produtos: {{products}}',
          variables: {
            products: '{{products}}'
          },
          category: 'tracking',
          is_active: true,
          created_at: '2025-10-03T00:00:00Z',
          updated_at: '2025-10-03T00:00:00Z'
        };

        (getTemplate as jest.Mock).mockResolvedValue(templateWithLoop);
        (transporter.sendMail as jest.Mock).mockResolvedValue({ messageId: '123' });

        await sendTrackingEmail({
          customer_name: 'Ana',
          email: 'ana@email.com',
          tracking_code: 'AB444555666BR',
          products: 'Produto A, Produto B',
          status: 'Objeto entregue'
        });

        expect(transporter.sendMail).toHaveBeenCalledWith(
          expect.objectContaining({
            html: '<p>Produtos: Produto A, Produto B</p>',
            text: 'Produtos: Produto A, Produto B'
          })
        );
      });
    });

    describe('condicionais aninhados', () => {
      it('deve renderizar condicionais aninhados corretamente', async () => {
        const templateWithNestedConditionals = {
          id: '1',
          name: 'Não entregue',
          subject: 'Entrega não realizada',
          body_html: '{{#if unit_address}}<p>Endereço: {{unit_address}}</p>{{#if unit_cep}}<p>CEP: {{unit_cep}}</p>{{/if}}{{/if}}',
          body_text: '{{#if unit_address}}Endereço: {{unit_address}}{{#if unit_cep}} CEP: {{unit_cep}}{{/if}}{{/if}}',
          variables: {
            unit_address: '{{unit_address}}',
            unit_cep: '{{unit_cep}}'
          },
          category: 'tracking',
          is_active: true,
          created_at: '2025-10-03T00:00:00Z',
          updated_at: '2025-10-03T00:00:00Z'
        };

        (getTemplate as jest.Mock).mockResolvedValue(templateWithNestedConditionals);
        (transporter.sendMail as jest.Mock).mockResolvedValue({ messageId: '123' });

        await sendTrackingEmail({
          customer_name: 'Pedro',
          email: 'pedro@email.com',
          tracking_code: 'AB777888999BR',
          products: 'Produto X',
          status: 'Não entregue',
          unit_address: 'Rua Exemplo, 123',
          unit_cep: '12345-678'
        });

        expect(transporter.sendMail).toHaveBeenCalledWith(
          expect.objectContaining({
            html: '<p>Endereço: Rua Exemplo, 123</p><p>CEP: 12345-678</p>',
            text: 'Endereço: Rua Exemplo, 123 CEP: 12345-678'
          })
        );
      });
    });
  });
});
