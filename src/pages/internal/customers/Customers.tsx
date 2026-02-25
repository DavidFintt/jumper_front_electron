/// <reference types="../../../global" />
import React, { useState, useEffect } from 'react';
import { Layout } from '../../../components/layout';
import { Button, Alert, DataTable, Input } from '../../../components/ui';
import type { Column } from '../../../components/ui';
import { customerService, companyPrinterService } from '../../../services';
import type { Customer, Dependente } from '../../../services/types';
import { FiEdit2, FiTrash2, FiPlus, FiX, FiSave, FiUserPlus } from 'react-icons/fi';
import { toast } from 'react-toastify';
import './Customers.css';

// Interface para dependente no formulário
interface DependenteForm {
  id?: number;
  nome: string;
  data_nascimento: string;
  pcd: boolean; // Adicionado aqui
  _delete?: boolean;
}

const Customers: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState<Partial<Customer & { pcd: boolean; estrangeiro: boolean }>>({
    nome: '',
    cpf: '',
    telefone: '',
    email: '',
    data_nascimento: '',
    endereco: '',
    cep: '',
    cidade: '',
    is_active: true,
    pcd: false,
    estrangeiro: false,
  });
  const [dependentes, setDependentes] = useState<DependenteForm[]>([]);
  const [novoDependenteIndex, setNovoDependenteIndex] = useState<number | null>(null);
  
  // Printer configuration
  const [a4PrinterName, setA4PrinterName] = useState<string | null>(null);

  const userData = JSON.parse(localStorage.getItem('userData') || '{}');
  const selectedCompany = localStorage.getItem('selectedCompany');
  const companyId = selectedCompany ? parseInt(selectedCompany) : userData.company;

  useEffect(() => {
    loadCustomers();
    loadA4Printer();
  }, []);

  const loadA4Printer = async () => {
    try {
      if (!companyId) return;
      
      const response = await companyPrinterService.getA4PrinterName(companyId);
      if (response.success && response.a4_printer) {
        setA4PrinterName(response.a4_printer);
        console.log('Impressora A4 configurada:', response.a4_printer);
      } else {
        setA4PrinterName(null);
      }
    } catch (err: any) {
      console.error('Error loading A4 printer:', err);
      setA4PrinterName(null);
    }
  };

  const loadCustomers = async () => {
    if (!companyId) {
      setCustomers([]);
      setLoading(false);
      setError('Nenhuma empresa definida. Faça login novamente.');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const response = await customerService.list(companyId);
      setCustomers(response.data || []);
    } catch (err: any) {
      console.error('Error loading customers:', err);
      setError(err.response?.data?.error || 'Erro ao carregar clientes');
    } finally {
      setLoading(false);
    }
  };

  // Calcular idade
  const calculateAge = (birthDate: string) => {
    if (!birthDate) return undefined;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const handleOpenModal = async (customer?: Customer) => {
    if (customer) {
      setEditingCustomer(customer);
      setFormData({
        nome: customer.nome,
        cpf: customer.cpf,
        telefone: customer.telefone,
        email: customer.email,
        data_nascimento: customer.data_nascimento,
        endereco: customer.endereco,
        cep: customer.cep,
        cidade: customer.cidade,
        is_active: customer.is_active,
        pcd: customer.pcd || false,
        estrangeiro: customer.estrangeiro || false,
      });
      
      // Carregar dependentes do cliente
      try {
        const response = await customerService.listDependentes(companyId);
        const clienteDependentes = (response.data || []).filter((d: Dependente) => d.cliente === customer.id);
        setDependentes(clienteDependentes.map((d: Dependente) => ({
          id: d.id,
          nome: d.nome,
          data_nascimento: d.data_nascimento,
          pcd: d.pcd || false, // Adicionado aqui
        })));
      } catch (err) {
        console.error('Erro ao carregar dependentes:', err);
        setDependentes([]);
      }
    } else {
      setEditingCustomer(null);
      setFormData({
        nome: '',
        cpf: '',
        telefone: '',
        email: '',
        data_nascimento: '',
        endereco: '',
        cep: '',
        cidade: '',
        is_active: true,
        pcd: false,
        estrangeiro: false,
      });
      setDependentes([]);
    }
    setShowModal(true);
    setError(null);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCustomer(null);
    setDependentes([]);
    setFormData({
      nome: '',
      cpf: '',
      telefone: '',
      email: '',
      data_nascimento: '',
      endereco: '',
      cep: '',
      cidade: '',
      is_active: true,
      pcd: false,
      estrangeiro: false,
    });
    setError(null);
  };

  const handleAddDependente = () => {
    setDependentes([{ nome: '', data_nascimento: '', pcd: false }, ...dependentes]);
    setNovoDependenteIndex(0); // Marca o primeiro item (recém-adicionado) como novo
    
    // Remove o destaque após 3 segundos
    setTimeout(() => {
      setNovoDependenteIndex(null);
    }, 3000);
  };

  const handleRemoveDependente = (index: number) => {
    const dep = dependentes[index];
    if (dep.id) {
      // Se tem ID, marcar para exclusão
      const updated = [...dependentes];
      updated[index] = { ...dep, _delete: true };
      setDependentes(updated);
    } else {
      // Se não tem ID, apenas remover da lista
      setDependentes(dependentes.filter((_, i) => i !== index));
    }
  };

  const handleDependenteChange = (index: number, field: keyof DependenteForm, value: string | boolean) => {
    const updated = [...dependentes];
    updated[index] = { ...updated[index], [field]: value };
    setDependentes(updated);
  };

  // Funções de máscara
  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 10) {
      return numbers.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    } else {
      return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
  };

  const formatCEP = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return numbers.replace(/(\d{5})(\d{3})/, '$1-$2');
  };

  const imprimirTermo = async (menoresDeIdadeIds: number[]) => {
    try {
      const baseUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}`;
      const token = localStorage.getItem('accessToken');
      
      console.log('=== DEBUG IMPRESSÃO TERMO (Clientes) ===');
      console.log('window.electronAPI existe?', !!window.electronAPI);
      console.log('window.electronAPI.printA4 existe?', !!window.electronAPI?.printA4);
      console.log('a4PrinterName:', a4PrinterName);
      console.log('Menores de idade:', menoresDeIdadeIds.length);
      console.log('========================================');
      
      if (!token) {
        toast.error('Erro: Token de autenticação não encontrado. Faça login novamente.');
        return;
      }
      
      let pdfBlob: Blob;
      
      // Buscar o PDF do backend
      if (menoresDeIdadeIds.length === 1) {
        const response = await fetch(
          `${baseUrl}/api/dependentes/${menoresDeIdadeIds[0]}/termo/?company_id=${companyId}`,
          {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` },
          }
        );
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error('Erro ao gerar termo:', errorData);
          toast.error('Erro ao gerar termo de responsabilidade');
          return;
        }
        
        pdfBlob = await response.blob();
      } else {
        const response = await fetch(
          `${baseUrl}/api/dependentes/termo-multiplo/?company_id=${companyId}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ dependente_ids: menoresDeIdadeIds }),
          }
        );
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error('Erro ao gerar termo:', errorData);
          toast.error('Erro ao gerar termo de responsabilidade');
          return;
        }
        
        pdfBlob = await response.blob();
      }
      
      // Verificar se pode imprimir via Electron
      if (window.electronAPI?.printA4 && a4PrinterName) {
        try {
          console.log('✅ Imprimindo termo via Electron com impressora A4:', a4PrinterName);
          
          // Converter blob para base64
          const arrayBuffer = await pdfBlob.arrayBuffer();
          const base64 = btoa(
            new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
          );
          
          const result = await window.electronAPI.printA4(a4PrinterName, base64);
          
          console.log('Resultado da impressão:', result);
          
          if (result.success) {
            toast.success('Termo de responsabilidade impresso com sucesso!');
          } else {
            toast.error(`Erro ao imprimir: ${result.error || 'Erro desconhecido'}`);
            imprimirTermoFallback(pdfBlob, menoresDeIdadeIds.length);
          }
        } catch (error) {
          console.error('❌ Erro ao imprimir via Electron:', error);
          toast.error('Erro ao imprimir termo');
          imprimirTermoFallback(pdfBlob, menoresDeIdadeIds.length);
        }
      } else {
        console.log('⚠️ Usando fallback browser');
        if (!a4PrinterName) {
          console.warn('  - Impressora A4 não configurada');
        }
        imprimirTermoFallback(pdfBlob, menoresDeIdadeIds.length);
      }
      
      toast.info(`Termo de responsabilidade processado (${menoresDeIdadeIds.length} menor${menoresDeIdadeIds.length > 1 ? 'es' : ''})`);
    } catch (error) {
      console.error('Erro ao processar termo:', error);
      toast.error('Erro ao processar termo de responsabilidade');
    }
  };

  const imprimirTermoFallback = (pdfBlob: Blob, quantidade: number) => {
    // Fallback silencioso - logs já foram mostrados no console
    const url = window.URL.createObjectURL(pdfBlob);
    
    const newTab = window.open(url, '_blank');
    if (!newTab) {
      const a = document.createElement('a');
      a.href = url;
      a.download = quantidade > 1 ? 'termo_responsabilidade_multiplos.pdf' : 'termo_responsabilidade.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast.warning('Pop-up bloqueado. PDF baixado automaticamente.');
    }
    
    setTimeout(() => window.URL.revokeObjectURL(url), 60000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validações
    if (!formData.nome?.trim()) {
      setError('Nome é obrigatório');
      return;
    }

    if (!formData.telefone?.trim()) {
      setError('Telefone é obrigatório');
      return;
    }

    try {
      const data = {
        ...formData,
        company: companyId,
        // Manter a formatação dos campos
        cpf: formData.cpf || undefined,
        telefone: formData.telefone || undefined,
        cep: formData.cep || undefined,
      };

      let customerId: number;

      if (editingCustomer) {
        await customerService.update(editingCustomer.id, data, companyId);
        customerId = editingCustomer.id;
        toast.success('Cliente atualizado com sucesso!');
      } else {
        const response = await customerService.create(data, companyId);
        customerId = response.data?.id || 0;
        toast.success('Cliente criado com sucesso!');
      }

      // Processar dependentes e coletar IDs de menores de idade
      const menoresDeIdadeIds: number[] = [];
      
      for (const dep of dependentes) {
        if (dep._delete && dep.id) {
          // Deletar dependente
          await customerService.deleteDependente(dep.id, companyId);
        } else if (!dep._delete) {
          // Validar dependente
          if (!dep.nome.trim() || !dep.data_nascimento) {
            continue; // Pular dependentes incompletos
          }

          const depData = {
            nome: dep.nome,
            data_nascimento: dep.data_nascimento,
            cliente: customerId,
            company: companyId,
            pcd: dep.pcd,
          } as any;

          let dependenteId: number;
          
          if (dep.id) {
            // Atualizar dependente existente
            await customerService.updateDependente(dep.id, depData, companyId);
            dependenteId = dep.id;
          } else {
            // Criar novo dependente
            const depResponse = await customerService.createDependente(depData, companyId);
            if (depResponse.data) {
              dependenteId = depResponse.data.id;
            } else {
              continue;
            }
          }
          
          // Verificar se é menor de 18 anos
          const dataNasc = new Date(dep.data_nascimento);
          const hoje = new Date();
          let idade = hoje.getFullYear() - dataNasc.getFullYear();
          const mesAtual = hoje.getMonth();
          const mesNasc = dataNasc.getMonth();
          if (mesAtual < mesNasc || (mesAtual === mesNasc && hoje.getDate() < dataNasc.getDate())) {
            idade--;
          }
          
          if (idade < 18) {
            console.log(`✅ Dependente ${dep.nome} é menor de idade (${idade} anos)`);
            menoresDeIdadeIds.push(dependenteId);
          }
        }
      }

      handleCloseModal();
      await loadCustomers();
      
      // Se houver menores de idade, imprimir termo
      if (menoresDeIdadeIds.length > 0) {
        setTimeout(async () => {
          await imprimirTermo(menoresDeIdadeIds);
        }, 500);
      }
    } catch (err: any) {
      console.error('Error saving customer:', err);
      const errorMsg = err.response?.data?.error || err.response?.data?.message || 'Erro ao salvar cliente';
      setError(errorMsg);
      toast.error(errorMsg);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Tem certeza que deseja deletar este cliente?')) {
      return;
    }

    try {
      await customerService.delete(id);
      toast.success('Cliente deletado com sucesso!');
      await loadCustomers();
    } catch (err: any) {
      console.error('Error deleting customer:', err);
      const errorMsg = err.response?.data?.error || 'Erro ao deletar cliente';
      setError(errorMsg);
      toast.error(errorMsg);
    }
  };

  const columns: Column[] = [
    { key: 'nome', label: 'Nome', sortable: true },
    { 
      key: 'pcd', 
      label: 'PcD',
      render: (customer: Customer) => customer.pcd ? <span title="Pessoa com Deficiência">♿</span> : ''
    },
    { key: 'cpf', label: 'CPF' },
    { key: 'telefone', label: 'Telefone' },
    { key: 'email', label: 'E-mail' },
    { 
      key: 'data_nascimento', 
      label: 'Data Nascimento',
      render: (customer: Customer) => new Date(customer.data_nascimento).toLocaleDateString('pt-BR')
    },
    { 
      key: 'idade', 
      label: 'Idade',
      render: (customer: Customer) => calculateAge(customer.data_nascimento) || '-'
    },
    {
      key: 'is_active',
      label: 'Status',
      render: (customer: Customer) => (
        <span className={`status-badge ${customer.is_active ? 'active' : 'inactive'}`}>
          {customer.is_active ? 'Ativo' : 'Inativo'}
        </span>
      ),
    },
    {
      key: 'id',
      label: 'Ações',
      render: (customer: Customer) => (
        <div className="action-buttons">
          <button
            className="icon-button edit"
            onClick={() => handleOpenModal(customer)}
            title="Editar"
          >
            <FiEdit2 />
          </button>
          <button
            className="icon-button delete"
            onClick={() => handleDelete(customer.id)}
            title="Deletar"
          >
            <FiTrash2 />
          </button>
        </div>
      ),
    },
  ];

  return (
    <Layout>
      <div className="customers-page">
        <div className="page-header">
          <div>
            <h1>Clientes</h1>
            <p className="page-subtitle">Gerencie os clientes da empresa</p>
          </div>
          <Button
            variant="primary"
            onClick={() => handleOpenModal()}
          >
            <FiPlus /> Novo Cliente
          </Button>
        </div>

        {error && <Alert variant="error">{error}</Alert>}

        <DataTable
          data={customers}
          columns={columns}
          loading={loading}
        />

        {showModal && (
          <div className="modal-overlay" onClick={handleCloseModal}>
            <div className="modal-content customer-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{editingCustomer ? 'Editar Cliente' : 'Novo Cliente'}</h2>
                <button className="modal-close" onClick={handleCloseModal}>
                  <FiX />
                </button>
              </div>

              <div className="modal-body">
                {error && <Alert variant="error">{error}</Alert>}
                
                <form className="customer-form" onSubmit={handleSubmit}>
                  {/* Dados do Cliente */}
                  <div className="form-section">
                    <h3 className="section-title">Dados do Cliente</h3>
                    <div className="form-grid">
                      <div className="form-group">
                        <label htmlFor="nome">Nome *</label>
                        <Input
                          id="nome"
                          value={formData.nome || ''}
                          onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                          placeholder="Nome completo"
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="cpf">CPF</label>
                        <div className="cpf-field-wrapper">
                          <Input
                            id="cpf"
                            value={formData.cpf || ''}
                            onChange={(e) => setFormData({ ...formData, cpf: formatCPF(e.target.value) })}
                            placeholder="000.000.000-00"
                            maxLength={14}
                            disabled={formData.estrangeiro}
                            style={{ flex: 1 }}
                          />
                          <div className="form-group-checkbox">
                            <label>
                              <input
                                type="checkbox"
                                checked={formData.estrangeiro}
                                onChange={(e) => {
                                  const isEstrangeiro = e.target.checked;
                                  setFormData({ 
                                    ...formData, 
                                    estrangeiro: isEstrangeiro,
                                    cpf: isEstrangeiro ? '' : formData.cpf // Limpa o CPF se marcar como estrangeiro
                                  });
                                }}
                              />
                              Estrangeiro
                            </label>
                          </div>
                        </div>
                      </div>

                      <div className="form-group">
                        <label htmlFor="telefone">Telefone *</label>
                        <Input
                          id="telefone"
                          value={formData.telefone || ''}
                          onChange={(e) => setFormData({ ...formData, telefone: formatPhone(e.target.value) })}
                          placeholder="(00) 00000-0000"
                          maxLength={15}
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="email">E-mail</label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email || ''}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="email@exemplo.com"
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="data_nascimento">Data de Nascimento</label>
                        <Input
                          id="data_nascimento"
                          type="date"
                          value={formData.data_nascimento || ''}
                          onChange={(e) => setFormData({ ...formData, data_nascimento: e.target.value })}
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="cep">CEP</label>
                        <Input
                          id="cep"
                          value={formData.cep || ''}
                          onChange={(e) => setFormData({ ...formData, cep: formatCEP(e.target.value) })}
                          placeholder="00000-000"
                          maxLength={9}
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="endereco">Endereço</label>
                        <Input
                          id="endereco"
                          value={formData.endereco || ''}
                          onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                          placeholder="Rua, número, complemento"
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="cidade">Cidade</label>
                        <Input
                          id="cidade"
                          value={formData.cidade || ''}
                          onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                          placeholder="Cidade"
                        />
                      </div>
                    </div>

                    <div className="form-group-checkbox-wrapper">
                      <div className="form-group-checkbox">
                        <label>
                          <input
                            type="checkbox"
                            checked={formData.is_active}
                            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                          />
                          Cliente Ativo
                        </label>
                      </div>
                      <div className="form-group-checkbox">
                        <label>
                          <input
                            type="checkbox"
                            checked={formData.pcd}
                            onChange={(e) => setFormData({ ...formData, pcd: e.target.checked })}
                          />
                          Cliente é PcD
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Dependentes */}
                  <div className="form-section">
                    <div className="section-header">
                      <h3 className="section-title">Dependentes</h3>
                      <Button
                        type="button"
                        variant="outline"
                        size="small"
                        onClick={handleAddDependente}
                      >
                        <FiUserPlus /> Adicionar Dependente
                      </Button>
                    </div>

                    {dependentes.filter(d => !d._delete).length === 0 ? (
                      <p className="no-dependentes">Nenhum dependente adicionado</p>
                    ) : (
                      <div className="dependentes-table-container">
                        <table className="dependentes-table">
                          <thead>
                            <tr>
                              <th>Nome do Dependente</th>
                              <th>Data de Nascimento</th>
                              <th>Idade</th>
                              <th>PcD</th>
                              <th>Ações</th>
                            </tr>
                          </thead>
                          <tbody>
                            {dependentes.map((dep, index) => {
                              if (dep._delete) return null;
                              
                              return (
                                <tr key={index} className={`${index === novoDependenteIndex ? 'novo-dependente' : ''}`}>
                                  <td>
                                    <Input
                                      value={dep.nome}
                                      onChange={(e) => handleDependenteChange(index, 'nome', e.target.value)}
                                      placeholder="Nome do dependente"
                                      autoFocus={index === novoDependenteIndex}
                                    />
                                  </td>
                                  <td>
                                    <Input
                                      type="date"
                                      value={dep.data_nascimento}
                                      onChange={(e) => handleDependenteChange(index, 'data_nascimento', e.target.value)}
                                    />
                                  </td>
                                  <td className="td-idade">
                                    <span className="dependente-idade-badge">{calculateAge(dep.data_nascimento) || 0} anos</span>
                                  </td>
                                  <td className="td-checkbox">
                                    <label className="checkbox-label">
                                      <input 
                                        type="checkbox"
                                        checked={dep.pcd}
                                        onChange={(e) => handleDependenteChange(index, 'pcd', e.target.checked)}
                                      />
                                      <span className="checkbox-text">Sim</span>
                                    </label>
                                  </td>
                                  <td className="td-actions">
                                    <button
                                      type="button"
                                      className="remove-dependente-btn-table"
                                      onClick={() => handleRemoveDependente(index)}
                                      title="Remover dependente"
                                    >
                                      <FiTrash2 size={18} />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </form>
              </div>

              <div className="modal-actions">
                <Button variant="outline" onClick={handleCloseModal}>
                  Cancelar
                </Button>
                <Button variant="primary" onClick={handleSubmit}>
                  <FiSave /> Salvar
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Customers;
