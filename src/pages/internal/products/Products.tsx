import React, { useState, useEffect } from 'react';
import { Layout } from '../../../components/layout';
import { Button, Alert, DataTable, Input } from '../../../components/ui';
import type { Column, Filter } from '../../../components/ui';
import { productService, equipmentUnitService } from '../../../services';
import type { Product, ProductType, EquipmentUnit } from '../../../services/types';
import { FiPlus, FiEdit2, FiTrash2, FiDollarSign, FiX, FiSave, FiPackage } from 'react-icons/fi';
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

  // Equipment Units state
  const [showUnitsModal, setShowUnitsModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [equipmentUnits, setEquipmentUnits] = useState<EquipmentUnit[]>([]);
  const [unitFormData, setUnitFormData] = useState({
    number: '',
    status: 'available',
    is_active: true,
  });
  const [editingUnit, setEditingUnit] = useState<EquipmentUnit | null>(null);
  
  // Temporary units for equipment during creation/edit
  const [tempUnits, setTempUnits] = useState<string[]>([]);
  const [newUnitNumber, setNewUnitNumber] = useState('');

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
    setTempUnits([]);
    setNewUnitNumber('');
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
    setTempUnits([]);
    setNewUnitNumber('');
    setEquipmentUnits([]);
  };

  const handleEdit = async (product: Product) => {
    console.log('handleEdit chamado para produto:', product);
    setEditingProduct(product);
    
    let duration = '';
    if (product.product_type_name === 'Tempo de uso') {
      const minuteMatch = product.name.match(/(\d+)\s*Minutos/i);
      if (minuteMatch) {
        const minutes = parseInt(minuteMatch[1]);
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
    
    // Se for equipamento, carrega as unidades existentes
    console.log('É equipamento?', product.product_type_name === 'Equipamento', 'Tipo:', product.product_type_name);
    if (product.product_type_name === 'Equipamento') {
      console.log('Carregando unidades para produto ID:', product.id);
      await loadEquipmentUnits(product.id);
    }
    
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price.toString(),
      product_type: product.product_type.toString(),
      is_active: product.is_active,
      duration: duration,
    });
    setTempUnits([]);
    setNewUnitNumber('');
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

  // Temporary Units Functions (for equipment during creation)
  const handleAddTempUnit = () => {
    const trimmed = newUnitNumber.trim();
    console.log('handleAddTempUnit chamado. Novo número:', trimmed);
    console.log('TempUnits atual:', tempUnits);
    
    if (!trimmed) {
      toast.error('Digite um número para a unidade');
      return;
    }
    if (tempUnits.includes(trimmed)) {
      toast.error('Este número já foi adicionado');
      return;
    }
    // Verifica se já existe nas unidades do produto (quando editando)
    if (equipmentUnits.some(u => u.number === trimmed)) {
      toast.error('Este número já existe para este equipamento');
      return;
    }
    
    const newTempUnits = [...tempUnits, trimmed];
    console.log('Nova lista de tempUnits:', newTempUnits);
    setTempUnits(newTempUnits);
    setNewUnitNumber('');
    toast.success(`Unidade #${trimmed} adicionada!`);
  };

  const handleRemoveTempUnit = (number: string) => {
    setTempUnits(tempUnits.filter(u => u !== number));
  };

  // Equipment Units Functions
  const handleManageUnits = async (product: Product) => {
    setSelectedProduct(product);
    setShowUnitsModal(true);
    await loadEquipmentUnits(product.id);
  };

  const loadEquipmentUnits = async (productId: number) => {
    console.log('loadEquipmentUnits chamado para produto ID:', productId);
    try {
      const response = await equipmentUnitService.list(productId);
      console.log('Resposta do loadEquipmentUnits:', response);
      if (response.success) {
        const units = response.data || [];
        console.log('Unidades carregadas:', units);
        setEquipmentUnits(units);
      } else {
        console.error('Erro ao carregar unidades:', response.error);
        toast.error(response.error || 'Erro ao carregar unidades');
      }
    } catch (err: any) {
      console.error('Erro ao conectar ao servidor:', err);
      toast.error('Erro ao conectar ao servidor');
    }
  };

  const handleSubmitUnit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedProduct) return;

    try {
      let response;
      if (editingUnit) {
        response = await equipmentUnitService.update(editingUnit.id, unitFormData);
      } else {
        response = await equipmentUnitService.create({
          product: selectedProduct.id,
          ...unitFormData,
        });
      }

      if (response.success) {
        toast.success(editingUnit ? 'Unidade atualizada com sucesso!' : 'Unidade criada com sucesso!');
        setUnitFormData({ number: '', status: 'available', is_active: true });
        setEditingUnit(null);
        loadEquipmentUnits(selectedProduct.id);
      } else {
        if (typeof response.error === 'object' && response.error !== null) {
          Object.values(response.error).forEach(errors => {
            const errorMessages = Array.isArray(errors) ? errors : [errors];
            errorMessages.forEach(error => toast.error(error));
          });
        } else {
          toast.error(response.error || 'Erro ao salvar unidade');
        }
      }
    } catch (err: any) {
      toast.error('Erro ao conectar ao servidor');
    }
  };

  const handleEditUnit = (unit: EquipmentUnit) => {
    setEditingUnit(unit);
    setUnitFormData({
      number: unit.number,
      status: unit.status,
      is_active: unit.is_active,
    });
  };

  const handleDeleteUnit = async (unit: EquipmentUnit) => {
    if (!window.confirm(`Tem certeza que deseja deletar a unidade "${unit.number}"?`)) {
      return;
    }

    try {
      const response = await equipmentUnitService.delete(unit.id);
      if (response.success) {
        toast.success('Unidade deletada com sucesso!');
        if (selectedProduct) {
          loadEquipmentUnits(selectedProduct.id);
        }
      } else {
        toast.error(response.error || 'Erro ao deletar unidade');
      }
    } catch (err: any) {
      toast.error('Erro ao conectar ao servidor');
    }
  };

  const handleCloseUnitsModal = () => {
    setShowUnitsModal(false);
    setSelectedProduct(null);
    setEquipmentUnits([]);
    setUnitFormData({ number: '', status: 'available', is_active: true });
    setEditingUnit(null);
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
      
      const productType = formData.product_type;
      
      // Verifica se é "Tempo de uso" pelo nome do tipo
      const selectedType = productTypes.find(t => t.id === formData.product_type);
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
            p.name !== 'Tempo Adicional' &&
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
        const savedProduct = response.data;
        console.log('Produto salvo:', savedProduct);
        
        // Se for equipamento e tem unidades temporárias, criar as unidades
        // APENAS quando estiver CRIANDO um produto novo (não editando)
        const isEquipment = selectedType?.name === 'Equipamento';
        const isCreating = !editingProduct;
        console.log('É equipamento?', isEquipment, 'Está criando?', isCreating, 'Unidades temporárias:', tempUnits);
        
        if (isEquipment && isCreating && tempUnits.length > 0 && savedProduct?.id) {
          console.log('Criando unidades para o produto ID:', savedProduct.id);
          let createdCount = 0;
          let errorCount = 0;
          
          for (const unitNumber of tempUnits) {
            try {
              const unitData = {
                product: savedProduct.id,
                number: unitNumber,
                status: 'available',
                is_active: true,
              };
              console.log('Criando unidade:', unitData);
              
              const unitResponse = await equipmentUnitService.create(unitData);
              console.log('Resposta da criação da unidade:', unitResponse);
              
              if (unitResponse.success) {
                createdCount++;
              } else {
                errorCount++;
                console.error(`Erro ao criar unidade ${unitNumber}:`, unitResponse.error);
                const errorMsg = unitResponse.details?.non_field_errors?.[0] || 
                                unitResponse.details?.number?.[0] || 
                                unitResponse.error || 
                                'Erro desconhecido';
                toast.error(`Erro ao criar unidade ${unitNumber}: ${errorMsg}`);
              }
            } catch (err: any) {
              errorCount++;
              console.error(`Erro ao criar unidade ${unitNumber}:`, err);
              toast.error(`Erro ao criar unidade ${unitNumber}`);
            }
          }
          
          if (createdCount > 0) {
            toast.success(`${createdCount} unidade(s) criada(s) com sucesso!`);
          }
        } else if (isEquipment && !isCreating && tempUnits.length > 0) {
          toast.info('Para adicionar ou editar unidades, use o botão "Gerenciar Unidades" na lista de produtos.');
        }
        
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
      render: (product) => {
        const isEquipment = product.product_type_name === 'Equipamento';
        return (
          <div className="action-buttons">
            {isEquipment && (
              <button 
                onClick={() => handleManageUnits(product)} 
                className="icon-button manage" 
                title="Gerenciar Unidades"
              >
                <FiPackage />
              </button>
            )}
            <button onClick={() => handleEdit(product)} className="icon-button edit" title="Editar">
              <FiEdit2 />
            </button>
            <button onClick={() => handleDelete(product)} className="icon-button delete" title="Desativar">
              <FiTrash2 />
            </button>
          </div>
        );
      },
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

        {/* Modal de Gerenciar Unidades */}
        {showUnitsModal && selectedProduct && (
          <div className="modal-overlay" onClick={handleCloseUnitsModal}>
            <div className="modal-content units-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Gerenciar Unidades - {selectedProduct.name}</h2>
                <button className="modal-close" onClick={handleCloseUnitsModal}><FiX /></button>
              </div>

              <div className="modal-body">
                <form onSubmit={handleSubmitUnit} className="unit-form">
                  <div className="form-row">
                    <div className="form-group">
                      <Input
                        label={editingUnit ? "Editar Número" : "Novo Número *"}
                        id="unit_number"
                        value={unitFormData.number}
                        onChange={(e) => setUnitFormData({ ...unitFormData, number: e.target.value })}
                        placeholder="Ex: 1, 2, A1, B2"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="unit_status">Status</label>
                      <select
                        id="unit_status"
                        value={unitFormData.status}
                        onChange={(e) => setUnitFormData({ ...unitFormData, status: e.target.value })}
                      >
                        <option value="available">Disponível</option>
                        <option value="in_use">Em Uso</option>
                        <option value="maintenance">Manutenção</option>
                      </select>
                    </div>

                    <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
                      <label className="checkbox-label" style={{ marginBottom: 0 }}>
                        <input
                          type="checkbox"
                          checked={unitFormData.is_active}
                          onChange={(e) => setUnitFormData({ ...unitFormData, is_active: e.target.checked })}
                        />
                        <span>Ativo</span>
                      </label>
                    </div>

                    <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
                      <Button type="submit" variant="primary" style={{ minWidth: 'auto' }}>
                        <FiSave /> {editingUnit ? 'Atualizar' : 'Adicionar'}
                      </Button>
                      {editingUnit && (
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => {
                            setEditingUnit(null);
                            setUnitFormData({ number: '', status: 'available', is_active: true });
                          }}
                          style={{ minWidth: 'auto' }}
                        >
                          <FiX /> Cancelar
                        </Button>
                      )}
                    </div>
                  </div>
                </form>

                <div className="units-list">
                  <h3>Unidades Cadastradas ({equipmentUnits.length})</h3>
                  {equipmentUnits.length === 0 ? (
                    <p className="empty-message">Nenhuma unidade cadastrada</p>
                  ) : (
                    <div className="units-grid">
                      {equipmentUnits.map((unit) => (
                        <div key={unit.id} className={`unit-card ${!unit.is_active ? 'inactive' : ''}`}>
                          <div className="unit-header">
                            <span className="unit-number">#{unit.number}</span>
                            <span className={`unit-status status-${unit.status}`}>
                              {unit.status_display}
                            </span>
                          </div>
                          <div className="unit-actions">
                            <button 
                              onClick={() => handleEditUnit(unit)} 
                              className="icon-button edit" 
                              title="Editar"
                            >
                              <FiEdit2 />
                            </button>
                            <button 
                              onClick={() => handleDeleteUnit(unit)} 
                              className="icon-button delete" 
                              title="Deletar"
                            >
                              <FiTrash2 />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
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

                  {/* Se for Equipamento, mostra seção de unidades */}
                  {(() => {
                    const selectedType = productTypes.find(t => t.id.toString() === formData.product_type);
                    return selectedType?.name === 'Equipamento';
                  })() && (
                    <div className="form-group full-width equipment-units-section">
                      <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px', color: '#374151' }}>
                        Unidades do Equipamento
                      </h3>
                      
                      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                        <Input
                          placeholder="Ex: 1, 2, A1, B2..."
                          value={newUnitNumber}
                          onChange={(e) => setNewUnitNumber(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddTempUnit();
                            }
                          }}
                        />
                        <Button 
                          type="button" 
                          onClick={handleAddTempUnit}
                          style={{ minWidth: 'auto', whiteSpace: 'nowrap' }}
                        >
                          <FiPlus /> Adicionar
                        </Button>
                      </div>

                      {/* Unidades Existentes (quando editando) */}
                      {editingProduct && equipmentUnits.length > 0 && (
                        <div style={{ marginBottom: '12px' }}>
                          <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px' }}>
                            Unidades já cadastradas:
                          </p>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                            {equipmentUnits.map((unit) => (
                              <span 
                                key={unit.id}
                                style={{
                                  padding: '4px 10px',
                                  background: '#e5e7eb',
                                  borderRadius: '6px',
                                  fontSize: '13px',
                                  color: '#374151',
                                }}
                              >
                                #{unit.number}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Unidades Temporárias (serão criadas ao salvar) */}
                      {tempUnits.length > 0 && (
                        <div>
                          <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px' }}>
                            {editingProduct ? 'Novas unidades a adicionar:' : 'Unidades a criar:'}
                          </p>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                            {tempUnits.map((unitNumber, index) => (
                              <span 
                                key={index}
                                style={{
                                  padding: '4px 10px',
                                  background: '#dbeafe',
                                  borderRadius: '6px',
                                  fontSize: '13px',
                                  color: '#1e40af',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                }}
                              >
                                #{unitNumber}
                                <button
                                  type="button"
                                  onClick={() => handleRemoveTempUnit(unitNumber)}
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    padding: 0,
                                    display: 'flex',
                                    alignItems: 'center',
                                    color: '#dc2626',
                                  }}
                                  title="Remover"
                                >
                                  <FiX size={14} />
                                </button>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {tempUnits.length === 0 && (!editingProduct || equipmentUnits.length === 0) && (
                        <p style={{ fontSize: '13px', color: '#9ca3af', fontStyle: 'italic' }}>
                          Nenhuma unidade adicionada
                        </p>
                      )}
                    </div>
                  )}
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
