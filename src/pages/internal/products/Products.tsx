import React, { useState, useEffect } from 'react';
import { Layout } from '../../../components/layout';
import { Button, Alert, DataTable, Input } from '../../../components/ui';
import type { Column, Filter } from '../../../components/ui';
import { productService } from '../../../services';
import type { Product, ProductType } from '../../../services/types';
import { FiPlus, FiEdit2, FiTrash2, FiDollarSign, FiX, FiSave } from 'react-icons/fi';
import { toast } from 'react-toastify';
import './Products.css';

export const Products: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    product_type: '',
    is_active: true,
    duration: '', // Para tempo de uso
  });

  // Get company ID from localStorage
  const userData = JSON.parse(localStorage.getItem('userData') || '{}');
  const selectedCompany = localStorage.getItem('selectedCompany');
  const companyId = selectedCompany ? parseInt(selectedCompany) : userData.company;

  useEffect(() => {
    loadProducts();
    loadProductTypes();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await productService.list({ company_id: companyId });
      if (response.success) {
        setProducts(response.data || []);
      } else {
        setError(response.error || 'Erro ao carregar produtos');
      }
    } catch (err: any) {
      setError('Erro ao conectar ao servidor');
    } finally {
      setLoading(false);
    }
  };

  const loadProductTypes = async () => {
    try {
      const response = await productService.listTypes(companyId);
      if (response.success) {
        setProductTypes(response.data || []);
      }
    } catch (err: any) {
      console.error('Erro ao carregar tipos de produtos:', err);
    }
  };

  const handleOpenModal = () => {
    setShowModal(true);
    setEditingProduct(null);
    setFormData({
      name: '',
      description: '',
      price: '',
      product_type: '',
      is_active: true,
      duration: '',
    });
    setError(null);
    setSuccess(null);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingProduct(null);
    setFormData({
      name: '',
      description: '',
      price: '',
      product_type: '',
      is_active: true,
      duration: '',
    });
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    
    // Se for tipo 1 (Tempo de uso), extrai a duração do nome (se aplicável)
    let duration = '';
    if (product.product_type === 1) {
      // Tenta extrair duração padrão do nome (ex: "5 Minutos", "1 Hora", "2 Horas")
      const minuteMatch = product.name.match(/(\d+)\s*Minutos/i);
      if (minuteMatch) {
        const minutes = parseInt(minuteMatch[1]);
        // Converte minutos para horas (formato decimal)
        if (minutes === 5) duration = '0.0833';
        else if (minutes === 10) duration = '0.1667';
        else if (minutes === 15) duration = '0.25';
        else if (minutes === 20) duration = '0.3333';
        else if (minutes === 30) duration = '0.5';
        else duration = (minutes / 60).toString();
      } else {
        // Tenta extrair horas
        const hourMatch = product.name.match(/(\d+)\s*(hora|horas)/i);
        if (hourMatch) {
          duration = hourMatch[1];
        }
      }
    }
    
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price.toString(),
      product_type: product.product_type.toString(),
      is_active: product.is_active,
      duration: duration,
    });
    setShowModal(true);
    setError(null);
    setSuccess(null);
  };

  const handleDelete = async (product: Product) => {
    if (!window.confirm(`Tem certeza que deseja desativar o produto "${product.name}"?`)) {
      return;
    }

    try {
      const response = await productService.delete(product.id, companyId);
      if (response.success) {
        toast.success('Produto desativado com sucesso!');
        loadProducts();
      } else {
        toast.error(response.error || 'Erro ao desativar produto');
      }
    } catch (err: any) {
      toast.error('Erro ao conectar ao servidor');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('=== INÍCIO DO SUBMIT ===');
    console.log('FormData:', formData);
    
    setError(null);
    setSuccess(null);

    try {
      // Validações básicas
      if (!formData.product_type) {
        toast.error('Tipo do produto é obrigatório');
        return;
      }
      
      const productType = parseInt(formData.product_type);
      
      // Verifica se é "Tempo de uso" pelo nome do tipo
      const selectedType = productTypes.find(t => t.id.toString() === formData.product_type);
      const isTempoDeUso = selectedType?.name === 'Tempo de uso';
      
      // Se for "Tempo de uso", valida a duração
      if (isTempoDeUso && !formData.duration) {
        toast.error('Duração é obrigatória para produtos de tempo de uso');
        return;
      }
      
      // Se NÃO for "Tempo de uso", valida o nome
      if (!isTempoDeUso && !formData.name.trim()) {
        toast.error('Nome do produto é obrigatório');
        return;
      }
      
      if (!formData.price || isNaN(parseFloat(formData.price))) {
        toast.error('Preço do produto é obrigatório e deve ser um número válido');
        return;
      }
      
      // Validação frontend antes de enviar
      const isActive = formData.is_active;
      const price = parseFloat(formData.price);
      
      // Gera o nome automaticamente se for "Tempo de uso"
      let productName = formData.name.trim();
      if (isTempoDeUso) {
        const duration = parseFloat(formData.duration);
        // Tratamento para minutos
        if (duration < 1) {
          const minutes = Math.round(duration * 60);
          productName = `${minutes} Minutos`;
        } 
        // Tratamento para horas
        else if (duration === 1) {
          productName = '1 Hora';
        } else {
          productName = `${duration} Horas`;
        }
      }
      
      console.log('Valores parseados:', { productType, isActive, price, productName, isTempoDeUso });
      
      // Validação de limite de 3 produtos de "Tempo de uso"
      if (isTempoDeUso && isActive) {
        const activeTempoDeUsoProducts = products.filter(p => {
          const pType = productTypes.find(pt => pt.id === p.product_type);
          return pType?.name === 'Tempo de uso' && 
            p.is_active && 
            p.name !== 'Tempo Adicional' && // Exclui o produto do sistema
            (!editingProduct || p.id !== editingProduct.id);
        });
        
        if (activeTempoDeUsoProducts.length >= 3) {
          toast.error('Você já possui 3 produtos de "Tempo de uso" ativos. Para cadastrar um novo, primeiro inative ou edite um dos produtos existentes.');
          return;
        }
      }

      const data = {
        name: productName,
        description: formData.description?.trim() || '',
        price: price,
        product_type: productType,
        is_active: isActive,
      };

      console.log('Dados sendo enviados:', data);

      let response;
      if (editingProduct) {
        console.log('Atualizando produto:', editingProduct.id);
        response = await productService.update(editingProduct.id, data, companyId);
      } else {
        console.log('Criando novo produto');
        response = await productService.create(data, companyId);
      }

      console.log('Resposta do backend:', response);

      if (response.success) {
        toast.success(editingProduct ? 'Produto atualizado com sucesso!' : 'Produto cadastrado com sucesso!');
        loadProducts();
        handleCloseModal();
      } else {
        toast.error(response.error || 'Erro ao salvar produto');
      }
    } catch (err: any) {
      console.error('Erro ao salvar produto:', err);
      toast.error(err.response?.data?.error || 'Erro ao conectar ao servidor');
    }
  };

  const formatPrice = (price: string | number): string => {
    if (!price && price !== 0) {
      return 'R$ 0,00';
    }
    const numericPrice = typeof price === 'string' ? parseFloat(price) : price;
    if (isNaN(numericPrice)) {
      return 'R$ 0,00';
    }
    return `R$ ${numericPrice.toFixed(2).replace('.', ',')}`;
  };

  // Configuração das colunas da tabela
  const columns: Column<Product>[] = [
    {
      key: 'name',
      label: 'Nome',
      sortable: true,
    },
    {
      key: 'product_type_name',
      label: 'Tipo',
      sortable: true,
    },
    {
      key: 'price',
      label: 'Preço',
      sortable: true,
      render: (product) => formatPrice(product.price),
    },
    {
      key: 'is_active',
      label: 'Status',
      sortable: true,
      render: (product) => (
        <span className={`status-badge ${product.is_active ? 'status-active' : 'status-inactive'}`}>
          {product.is_active ? 'Ativo' : 'Inativo'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Ações',
      render: (product) => (
        <div className="action-buttons">
          <button onClick={() => handleEdit(product)} className="icon-button edit" title="Editar">
            <FiEdit2 />
          </button>
          <button onClick={() => handleDelete(product)} className="icon-button delete" title="Desativar">
            <FiTrash2 />
          </button>
        </div>
      ),
    },
  ];

  // Configuração dos filtros
  const filters: Filter[] = [
    {
      key: 'product_type_name',
      label: 'Tipo',
      type: 'select',
      options: [
        { value: '', label: 'Todos' },
        ...productTypes.map(type => ({ value: type.name, label: type.name })),
      ],
    },
    {
      key: 'is_active',
      label: 'Status',
      type: 'select',
      options: [
        { value: '', label: 'Todos' },
        { value: 'true', label: 'Ativo' },
        { value: 'false', label: 'Inativo' },
      ],
    },
  ];

  return (
    <Layout>
      <div className="products-page">
        <div className="products-header">
          <div>
            <h1>Produtos</h1>
            <p className="products-subtitle">Gerencie os produtos e serviços oferecidos</p>
          </div>
          <Button onClick={handleOpenModal} leftIcon={<FiPlus />}>
            Novo Produto
          </Button>
        </div>

        {error && <Alert type="error" message={error} onClose={() => setError(null)} />}
        {success && <Alert type="success" message={success} onClose={() => setSuccess(null)} />}

        {loading ? (
          <div className="products-loading">Carregando produtos...</div>
        ) : (
          <DataTable
            data={products}
            columns={columns}
            filters={filters}
            searchPlaceholder="Buscar por nome..."
            emptyMessage="Nenhum produto cadastrado"
          />
        )}

        {/* Modal de Cadastro/Edição */}
        {showModal && (
          <div className="modal-overlay" onClick={handleCloseModal}>
            <div className="modal-content products-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{editingProduct ? 'Editar Produto' : 'Novo Produto'}</h2>
                <button className="modal-close" onClick={handleCloseModal}><FiX /></button>
              </div>
              
              <form onSubmit={handleSubmit} className="modal-body product-form">
                <div className="form-grid">
                  <div className="form-group">
                    <label htmlFor="product_type">Tipo *</label>
                    <select
                      id="product_type"
                      value={formData.product_type}
                      onChange={(e) => setFormData({ ...formData, product_type: e.target.value })}
                      required
                    >
                      <option value="" disabled>Selecione um tipo</option>
                      {productTypes.map((type) => (
                        <option key={type.id} value={type.id}>
                          {type.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Se for "Tempo de uso", mostra select de duração */}
                  {(() => {
                    const selectedType = productTypes.find(t => t.id.toString() === formData.product_type);
                    return selectedType?.name === 'Tempo de uso';
                  })() ? (
                    <div className="form-group">
                      <label htmlFor="duration">Duração *</label>
                      <select
                        id="duration"
                        value={formData.duration}
                        onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                        required
                      >
                        <option value="" disabled>Selecione a duração</option>
                        <option value="0.0833">5 Minutos</option>
                        <option value="0.1667">10 Minutos</option>
                        <option value="0.2500">15 Minutos</option>
                        <option value="0.3333">20 Minutos</option>
                        <option value="0.5000">30 Minutos</option>
                        <option value="1.0000">1 Hora</option>
                        <option value="2.0000">2 Horas</option>
                        <option value="3.0000">3 Horas</option>
                        <option value="4.0000">4 Horas</option>
                        <option value="5.0000">5 Horas</option>
                        <option value="6.0000">6 Horas</option>
                      </select>
                    </div>
                  ) : formData.product_type ? (
                    /* Se não for "Tempo de uso", mostra campo de nome normal */
                    <div className="form-group">
                      <Input
                        label="Nome do Produto *"
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Ex: Coca-Cola"
                      />
                    </div>
                  ) : null}

                  <div className="form-group">
                    <Input
                      label="Preço (R$) *"
                      id="price"
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      required
                      min="0.01"
                      step="0.01"
                      placeholder="0.00"
                      leftIcon={<FiDollarSign />}
                    />
                  </div>

                  <div className="form-group full-width">
                    <label htmlFor="description">Descrição</label>
                    <textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Descrição detalhada do produto..."
                      rows={4}
                    />
                  </div>

                  <div className="form-group full-width">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        id="is_active"
                        checked={formData.is_active}
                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      />
                      <span>Produto ativo</span>
                    </label>
                  </div>
                </div>

                <div className="modal-actions">
                  <Button type="button" variant="outline" onClick={handleCloseModal}>
                    <FiX /> Cancelar
                  </Button>
                  <Button type="submit" variant="primary">
                    <FiSave /> {editingProduct ? 'Salvar Alterações' : 'Cadastrar Produto'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Products;
