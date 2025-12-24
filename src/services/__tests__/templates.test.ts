import { getTemplate, getAllTemplates, createTemplate, updateTemplate, deleteTemplate } from '../templates';
import { supabase } from '../../config/supabase';

jest.mock('../../config/supabase', () => ({
  supabase: {
    from: jest.fn()
  }
}));

describe('Templates Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getTemplate', () => {
    it('deve retornar um template pelo nome', async () => {
      const mockTemplate = {
        id: '1',
        name: 'status-change',
        subject: 'Atualização de Status',
        body_html: '<p>Seu pedido foi atualizado</p>',
        body_text: 'Seu pedido foi atualizado',
        variables: { tracking_code: 'AB123456789BR' },
        category: 'tracking',
        is_active: true,
        created_at: '2025-10-03T00:00:00Z',
        updated_at: '2025-10-03T00:00:00Z'
      };

      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({ data: mockTemplate, error: null });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        single: mockSingle
      });

      mockSelect.mockReturnValue({
        eq: mockEq,
        single: mockSingle
      });

      mockEq.mockReturnValueOnce({
        eq: mockEq,
        single: mockSingle
      });

      mockEq.mockReturnValueOnce({
        single: mockSingle
      });

      const result = await getTemplate('status-change');

      expect(result).toEqual(mockTemplate);
      expect(supabase.from).toHaveBeenCalledWith('email_templates');
      expect(mockSelect).toHaveBeenCalledWith('*');
      expect(mockEq).toHaveBeenCalledWith('name', 'status-change');
      expect(mockEq).toHaveBeenCalledWith('is_active', true);
    });

    it('deve lançar erro quando template não encontrado', async () => {
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        single: mockSingle
      });

      mockSelect.mockReturnValue({
        eq: mockEq,
        single: mockSingle
      });

      mockEq.mockReturnValueOnce({
        eq: mockEq,
        single: mockSingle
      });

      mockEq.mockReturnValueOnce({
        single: mockSingle
      });

      await expect(getTemplate('non-existent')).rejects.toThrow('Template non-existent not found');
    });
  });

  describe('getAllTemplates', () => {
    it('deve retornar todos os templates ativos', async () => {
      const mockTemplates = [
        {
          id: '1',
          name: 'status-change',
          subject: 'Atualização de Status',
          body_html: '<p>Seu pedido foi atualizado</p>',
          body_text: 'Seu pedido foi atualizado',
          variables: {},
          category: 'tracking',
          is_active: true,
          created_at: '2025-10-03T00:00:00Z',
          updated_at: '2025-10-03T00:00:00Z'
        }
      ];

      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockOrder = jest.fn().mockResolvedValue({ data: mockTemplates, error: null });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        order: mockOrder
      });

      mockSelect.mockReturnValue({
        eq: mockEq,
        order: mockOrder
      });

      mockEq.mockReturnValue({
        order: mockOrder
      });

      const result = await getAllTemplates();

      expect(result).toEqual(mockTemplates);
      expect(supabase.from).toHaveBeenCalledWith('email_templates');
      expect(mockEq).toHaveBeenCalledWith('is_active', true);
      expect(mockOrder).toHaveBeenCalledWith('name');
    });

    it('deve retornar array vazio em caso de erro', async () => {
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockOrder = jest.fn().mockResolvedValue({ data: null, error: { message: 'Error' } });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        order: mockOrder
      });

      mockSelect.mockReturnValue({
        eq: mockEq,
        order: mockOrder
      });

      mockEq.mockReturnValue({
        order: mockOrder
      });

      const result = await getAllTemplates();

      expect(result).toEqual([]);
    });
  });

  describe('createTemplate', () => {
    it('deve criar um novo template', async () => {
      const newTemplate = {
        name: 'new-template',
        subject: 'Novo Template',
        body_html: '<p>HTML</p>',
        body_text: 'Text',
        variables: {},
        category: 'tracking',
        is_active: true
      };

      const createdTemplate = {
        ...newTemplate,
        id: '123',
        created_at: '2025-10-03T00:00:00Z',
        updated_at: '2025-10-03T00:00:00Z'
      };

      const mockInsert = jest.fn().mockReturnThis();
      const mockSelect = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({ data: createdTemplate, error: null });

      (supabase.from as any).mockReturnValue({
        insert: mockInsert,
        select: mockSelect,
        single: mockSingle
      });

      mockInsert.mockReturnValue({
        select: mockSelect,
        single: mockSingle
      });

      mockSelect.mockReturnValue({
        single: mockSingle
      });

      const result = await createTemplate(newTemplate);

      expect(result).toEqual(createdTemplate);
      expect(supabase.from).toHaveBeenCalledWith('email_templates');
      expect(mockInsert).toHaveBeenCalledWith(newTemplate);
    });

    it('deve lançar erro ao falhar na criação', async () => {
      const newTemplate = {
        name: 'new-template',
        subject: 'Novo Template',
        body_html: '<p>HTML</p>',
        body_text: 'Text',
        variables: {},
        category: 'tracking',
        is_active: true
      };

      const mockInsert = jest.fn().mockReturnThis();
      const mockSelect = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({ data: null, error: { message: 'Insert failed' } });

      (supabase.from as any).mockReturnValue({
        insert: mockInsert,
        select: mockSelect,
        single: mockSingle
      });

      mockInsert.mockReturnValue({
        select: mockSelect,
        single: mockSingle
      });

      mockSelect.mockReturnValue({
        single: mockSingle
      });

      await expect(createTemplate(newTemplate)).rejects.toThrow('Failed to create template');
    });
  });

  describe('updateTemplate', () => {
    it('deve atualizar um template existente', async () => {
      const updates = {
        subject: 'Assunto Atualizado',
        body_html: '<p>HTML atualizado</p>'
      };

      const updatedTemplate = {
        id: '1',
        name: 'status-change',
        subject: 'Assunto Atualizado',
        body_html: '<p>HTML atualizado</p>',
        body_text: 'Text',
        variables: {},
        category: 'tracking',
        is_active: true,
        created_at: '2025-10-03T00:00:00Z',
        updated_at: '2025-10-03T00:00:00Z'
      };

      const mockUpdate = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSelect = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({ data: updatedTemplate, error: null });

      (supabase.from as any).mockReturnValue({
        update: mockUpdate,
        eq: mockEq,
        select: mockSelect,
        single: mockSingle
      });

      mockUpdate.mockReturnValue({
        eq: mockEq,
        select: mockSelect,
        single: mockSingle
      });

      mockEq.mockReturnValue({
        select: mockSelect,
        single: mockSingle
      });

      mockSelect.mockReturnValue({
        single: mockSingle
      });

      const result = await updateTemplate('1', updates);

      expect(result).toEqual(updatedTemplate);
      expect(supabase.from).toHaveBeenCalledWith('email_templates');
      expect(mockUpdate).toHaveBeenCalledWith(updates);
      expect(mockEq).toHaveBeenCalledWith('id', '1');
    });

    it('deve lançar erro quando template não encontrado', async () => {
      const mockUpdate = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSelect = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } });

      (supabase.from as any).mockReturnValue({
        update: mockUpdate,
        eq: mockEq,
        select: mockSelect,
        single: mockSingle
      });

      mockUpdate.mockReturnValue({
        eq: mockEq,
        select: mockSelect,
        single: mockSingle
      });

      mockEq.mockReturnValue({
        select: mockSelect,
        single: mockSingle
      });

      mockSelect.mockReturnValue({
        single: mockSingle
      });

      await expect(updateTemplate('999', { subject: 'Test' })).rejects.toThrow('Template 999 not found');
    });
  });

  describe('deleteTemplate', () => {
    it('deve deletar um template', async () => {
      const mockDelete = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockResolvedValue({ data: null, error: null });

      (supabase.from as any).mockReturnValue({
        delete: mockDelete,
        eq: mockEq
      });

      mockDelete.mockReturnValue({
        eq: mockEq
      });

      await deleteTemplate('1');

      expect(supabase.from).toHaveBeenCalledWith('email_templates');
      expect(mockDelete).toHaveBeenCalled();
      expect(mockEq).toHaveBeenCalledWith('id', '1');
    });

    it('deve lançar erro ao falhar na deleção', async () => {
      const mockDelete = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockResolvedValue({ data: null, error: { message: 'Delete failed' } });

      (supabase.from as any).mockReturnValue({
        delete: mockDelete,
        eq: mockEq
      });

      mockDelete.mockReturnValue({
        eq: mockEq
      });

      await expect(deleteTemplate('1')).rejects.toThrow('Failed to delete template');
    });
  });
});
