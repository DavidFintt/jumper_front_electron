import React, { useState, useMemo } from 'react';
import './DataTable.css';

export interface Column {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (value: any, row: any) => React.ReactNode;
}

export interface FilterOption {
  value: string | number;
  label: string;
}

export interface Filter {
  key: string;
  label: string;
  type: 'select' | 'date' | 'dateRange' | 'text';
  options?: FilterOption[]; // Para filtros do tipo select
  placeholder?: string;
}

interface DataTableProps {
  columns: Column[];
  data: any[];
  loading?: boolean;
  onRowClick?: (row: any) => void;
  onSort?: (column: string, direction: 'asc' | 'desc') => void;
  className?: string;
  emptyMessage?: string;
  actions?: React.ReactNode;
  filters?: Filter[]; // Filtros opcionais
  onFilterChange?: (filters: Record<string, any>) => void; // Callback para mudanças nos filtros
  defaultFilters?: Record<string, any>; // Valores padrão dos filtros
}

const DataTable: React.FC<DataTableProps> = ({
  columns,
  data,
  loading = false,
  onRowClick,
  onSort,
  className = '',
  emptyMessage = 'Nenhum registro encontrado',
  actions,
  filters,
  onFilterChange,
  defaultFilters = {}
}) => {
  const [sortColumn, setSortColumn] = React.useState<string>('');
  const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>('asc');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterValues, setFilterValues] = useState<Record<string, any>>(defaultFilters);

  // Função para aplicar filtros customizados
  const applyCustomFilters = (rowData: any[]) => {
    if (!filters || Object.keys(filterValues).length === 0) {
      return rowData;
    }

    return rowData.filter(row => {
      return Object.entries(filterValues).every(([filterKey, filterValue]) => {
        if (!filterValue || filterValue === '') return true;

        const filter = filters.find(f => f.key === filterKey);
        if (!filter) return true;

        const rowValue = row[filterKey];

        switch (filter.type) {
          case 'select':
            return String(rowValue) === String(filterValue);
          
          case 'date':
            if (!rowValue) return false;
            const rowDate = new Date(rowValue);
            const filterDate = new Date(filterValue);
            return rowDate.toDateString() === filterDate.toDateString();
          
          case 'dateRange':
            if (!rowValue) return false;
            const date = new Date(rowValue);
            const { start, end } = filterValue;
            
            if (start && !end) {
              return date >= new Date(start);
            }
            if (!start && end) {
              const endDate = new Date(end);
              endDate.setHours(23, 59, 59, 999);
              return date <= endDate;
            }
            if (start && end) {
              const endDate = new Date(end);
              endDate.setHours(23, 59, 59, 999);
              return date >= new Date(start) && date <= endDate;
            }
            return true;
          
          case 'text':
            if (!rowValue) return false;
            return String(rowValue).toLowerCase().includes(String(filterValue).toLowerCase());
          
          default:
            return true;
        }
      });
    });
  };

  // Filtrar dados baseado no termo de busca e filtros customizados
  const filteredData = useMemo(() => {
    // Garantir que sempre temos um array
    if (!data || !Array.isArray(data)) {
      return [];
    }

    let result = data;

    // Aplicar filtros customizados primeiro
    result = applyCustomFilters(result);

    // Depois aplicar busca de texto
    if (searchTerm.trim()) {
      result = result.filter(row => {
        return columns.some(column => {
          const value = row[column.key];
          if (value === null || value === undefined) return false;
          
          const stringValue = String(value).toLowerCase();
          const normalizedSearch = searchTerm.toLowerCase().trim();
          
          return stringValue.includes(normalizedSearch);
        });
      });
    }

    return result || [];
  }, [data, searchTerm, columns, filterValues, filters]);

  const handleSort = (column: string) => {
    if (!columns.find(col => col.key === column)?.sortable) return;

    const newDirection = sortColumn === column && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortColumn(column);
    setSortDirection(newDirection);
    onSort?.(column, newDirection);
  };

  const handleFilterChange = (filterKey: string, value: any) => {
    const newFilters = { ...filterValues, [filterKey]: value };
    setFilterValues(newFilters);
    onFilterChange?.(newFilters);
  };

  const handleClearFilters = () => {
    setFilterValues({});
    setSearchTerm('');
    onFilterChange?.({});
  };

  const renderFilter = (filter: Filter) => {
    const value = filterValues[filter.key] || '';

    switch (filter.type) {
      case 'select':
        return (
          <div key={filter.key} className="filter-group">
            <label className="filter-label">
              {filter.label}
            </label>
            <select
              className="filter-input select"
              value={value}
              onChange={(e) => handleFilterChange(filter.key, e.target.value)}
            >
              <option value="">{filter.placeholder || `Todos`}</option>
              {filter.options?.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        );

      case 'date':
        return (
          <div key={filter.key} className="filter-group">
            <label className="filter-label">
              {filter.label}
            </label>
            <input
              type="date"
              className="filter-input"
              value={value}
              onChange={(e) => handleFilterChange(filter.key, e.target.value)}
            />
          </div>
        );

      case 'dateRange':
        const rangeValue = value || { start: '', end: '' };
        return (
          <div key={filter.key} className="filter-group range">
            <label className="filter-label">
              {filter.label}
            </label>
            <div className="filter-range-inputs">
              <input
                type="date"
                className="filter-input"
                value={rangeValue.start || ''}
                placeholder="Início"
                onChange={(e) => handleFilterChange(filter.key, { ...rangeValue, start: e.target.value })}
              />
              <input
                type="date"
                className="filter-input"
                value={rangeValue.end || ''}
                placeholder="Fim"
                onChange={(e) => handleFilterChange(filter.key, { ...rangeValue, end: e.target.value })}
              />
            </div>
          </div>
        );

      case 'text':
        return (
          <div key={filter.key} className="filter-group">
            <label className="filter-label">
              {filter.label}
            </label>
            <input
              type="text"
              className="filter-input"
              value={value}
              placeholder={filter.placeholder || 'Buscar...'}
              onChange={(e) => handleFilterChange(filter.key, e.target.value)}
            />
          </div>
        );

      default:
        return null;
    }
  };

  const renderCell = (column: Column, row: any) => {
    if (column.render) {
      return column.render(row);
    }
    return row[column.key];
  };

  if (loading) {
    return (
      <div className="data-table-container">
        <div className="data-table-loading">
          <div className="loading-spinner"></div>
          <p>Carregando dados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`data-table-container ${className}`}>
      <div className="data-table-header-section">
        {actions && <div className="data-table-actions">{actions}</div>}
      </div>
    
      {/* Filtros customizados e busca */}
      <div className="data-table-filters-section">
        {/* Campo de busca geral */}
        <div className="filter-group">
          <label className="filter-label">Buscar</label>
          <div className="search-input-wrapper">
            <i className="fas fa-search search-icon"></i>
            <input
              type="text"
              className="filter-input with-icon"
              placeholder="Buscar em todas as colunas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                className="clear-search-btn"
                onClick={() => setSearchTerm('')}
                title="Limpar busca"
              >
                <i className="fas fa-times"></i>
              </button>
            )}
          </div>
        </div>

        {/* Filtros customizados */}
        {filters && filters.map(filter => renderFilter(filter))}

        {/* Botão limpar */}
        <div className="filter-actions">
          <button
            className={`clear-all-btn ${(searchTerm || Object.keys(filterValues).length > 0) ? 'active' : ''}`}
            onClick={handleClearFilters}
            disabled={!searchTerm && Object.keys(filterValues).length === 0}
          >
            <i className="fas fa-filter-slash"></i> Limpar Filtros
          </button>
        </div>
      </div>
    
      <div className="data-table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`data-table-header-cell ${column.sortable ? 'sortable' : ''}`}
                  onClick={() => column.sortable && handleSort(column.key)}
                >
                  <div className="header-cell-content">
                    <span>{column.label}</span>
                    {column.sortable && (
                      <div className="sort-indicators">
                        <span className={`sort-arrow ${sortColumn === column.key && sortDirection === 'asc' ? 'active' : ''}`}>
                          ▲
                        </span>
                        <span className={`sort-arrow ${sortColumn === column.key && sortDirection === 'desc' ? 'active' : ''}`}>
                          ▼
                        </span>
                      </div>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="data-table-body">
            {filteredData.length === 0 ? (
              <tr className="data-table-empty">
                <td colSpan={columns.length} className="empty-cell">
                  <div className="empty-state">
                    <div className="empty-icon">
                      <i className="fas fa-folder-open"></i>
                    </div>
                    <p>{searchTerm ? 'Nenhum resultado encontrado para sua busca' : emptyMessage}</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredData.map((row, index) => (
                <tr
                  key={row.id || index}
                  className={`data-table-row ${onRowClick ? 'clickable' : ''}`}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map((column) => (
                    <td key={column.key} className={`data-table-cell ${column.key === 'actions' || column.key === 'id' ? 'actions-cell' : ''}`}>
                      {renderCell(column, row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DataTable;


