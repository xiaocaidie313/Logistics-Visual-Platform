import React, { useState, useEffect } from 'react';
import type { Product } from '../services/productService';
import {
  getProductList,
  createProduct,
  updateProduct,
  deleteProduct,
  updateProductStatus,
  searchProducts,
  getProductStatistics,
} from '../services/productService';
import { getUserList, User } from '../services/userService';
import ProductFormModal from '../components/ProductFormModal';

const ProductManagement: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterMerchant, setFilterMerchant] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });
  const [statistics, setStatistics] = useState<any>(null);
  const [merchants, setMerchants] = useState<User[]>([]); // 存储商家列表
  const [merchantMap, setMerchantMap] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchMerchants();
  }, []);

  useEffect(() => {
    fetchProducts();
    fetchStatistics();
  }, [pagination.page, filterCategory, filterStatus, filterMerchant]);

  const fetchMerchants = async () => {
    try {
      const response = await getUserList();
      if (response.code === 200) {
        const merchantList = response.data.filter(user => user.role === 'merchant');
        setMerchants(merchantList);
        
        const map: Record<string, string> = {};
        merchantList.forEach(m => {
          if (m._id) map[m._id] = m.username;
        });
        setMerchantMap(map);
      }
    } catch (error) {
      console.error('获取商家列表失败:', error);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params: any = {
        page: pagination.page,
        limit: pagination.limit
      };

      if (filterCategory) params.category = filterCategory;
      if (filterStatus) params.status = filterStatus;
      if (filterMerchant) params.merchantId = filterMerchant;

      const response = await getProductList(params);
      if (response.code === 200) {
        console.log('获取商品列表成功:', response.data);
        setProducts(response.data.products);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error('获取商品列表失败:', error);
      alert('获取商品列表失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await getProductStatistics();
      if (response.code === 200 && response.data) {
        setStatistics(response.data);
      } else {
        console.warn('获取统计数据失败，响应:', response);
        setStatistics({ totalProducts: 0, activeProducts: 0, inactiveProducts: 0, outOfStockProducts: 0 });
      }
    } catch (error) {
      console.error('获取统计数据失败:', error);
    }
  };

  const handleSearch = async () => {
    if (!searchKeyword.trim()) {
      fetchProducts();
      return;
    }

    setLoading(true);
    try {
      const response = await searchProducts(searchKeyword);
      if (response.code === 200) {
        setProducts(response.data);
      }
    } catch (error) {
      console.error('搜索失败:', error);
      alert('搜索失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProduct = async (productData: Partial<Product>) => {
    try {
      const response = await createProduct(productData);
      if (response.code === 200) {
        alert('创建商品成功');
        setModalVisible(false);
        fetchProducts();
        fetchStatistics();
      }
    } catch (error) {
      console.error('创建商品失败:', error);
      alert('创建商品失败');
    }
  };

  const handleUpdateProduct = async (productData: Partial<Product>) => {
    if (!currentProduct?._id) return;

    try {
      const response = await updateProduct(currentProduct._id, productData);
      if (response.code === 200) {
        alert('更新商品成功');
        setModalVisible(false);
        setCurrentProduct(null);
        fetchProducts();
      }
    } catch (error) {
      console.error('更新商品失败:', error);
      alert('更新商品失败');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm('确认删除此商品吗？')) return;

    try {
      const response = await deleteProduct(id);
      if (response.code === 200) {
        alert('删除商品成功');
        fetchProducts();
        fetchStatistics();
      }
    } catch (error) {
      console.error('删除商品失败:', error);
      alert('删除商品失败');
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      const response = await updateProductStatus(id, status);
      if (response.code === 200) {
        alert('状态更新成功');
        fetchProducts();
      }
    } catch (error) {
      console.error('更新状态失败:', error);
      alert('更新状态失败');
    }
  };

  const openEditModal = (product: Product) => {
    setCurrentProduct(product);
    setModalVisible(true);
  };

  const openCreateModal = () => {
    setCurrentProduct(null);
    setModalVisible(true);
  };

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      active: '在售',
      inactive: '下架',
      out_of_stock: '缺货'
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      active: '#4CAF50',
      inactive: '#FF9800',
      out_of_stock: '#F44336'
    };
    return colorMap[status] || '#999';
  };

  return (
    <div className="product-management">
      <div className="page-header">
        <h1>商品管理</h1>
      </div>

      {/* 统计卡片 */}
      {statistics && (
        <div className="statistics-cards">
          <div className="stat-card">
            <div className="stat-label">总商品数</div>
            <div className="stat-value">{statistics.total}</div>
          </div>
          {statistics.byStatus?.map((stat: any) => (
            <div key={stat._id} className="stat-card">
              <div className="stat-label">{getStatusText(stat._id)}</div>
              <div className="stat-value">{stat.count}</div>
            </div>
          ))}
        </div>
      )}

      {/* 搜索和筛选 */}
      <div className="toolbar">
        <div className="search-box">
          <input
            type="text"
            placeholder="搜索商品名称、ID..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button onClick={handleSearch}>搜索</button>
        </div>

        <div className="filters">
          <select
            value={filterMerchant}
            onChange={(e) => {
              console.log('商家选择改变:', e.target.value); // 调试：确认 onChange 被触发
              setFilterMerchant(e.target.value);
            }}
          >
            <option value="">所有商家</option>
            {merchants.map(merchant => (
              <option key={merchant._id} value={merchant._id}>
                {merchant.username}
              </option>
            ))}
          </select>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="">所有分类</option>
            <option value="电子产品">电子产品</option>
            <option value="服装">服装</option>
            <option value="食品">食品</option>
            <option value="图书">图书</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">所有状态</option>
            <option value="active">在售</option>
            <option value="inactive">下架</option>
            <option value="out_of_stock">缺货</option>
          </select>

          <button className="create-btn" onClick={openCreateModal}>
            + 新建商品
          </button>
        </div>
      </div>

      {/* 商品列表 */}
      {loading ? (
        <div className="loading">加载中...</div>
      ) : (
        <>
          <div className="product-table">
            <table>
              <thead>
                <tr>
                  <th>商品名称</th>
                  <th>商家</th>
                  <th>分类</th>
                  <th>SKU数量</th>
                  <th>状态</th>
                  <th>销量</th>
                  <th>创建时间</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product._id}>
                    <td>
                      <div className="product-name">
                        <strong>{product.productName}</strong>
                        {product.description && (
                          <small>{product.description}</small>
                        )}
                      </div>
                    </td>
                    <td>
                      {product.merchantId && merchantMap[product.merchantId] 
                        ? merchantMap[product.merchantId] 
                        : (product.merchantId || '-')}
                    </td>
                    <td>{product.category}</td>
                    <td>{product.skus.length}</td>
                    <td>
                      <span
                        className="status-badge"
                        style={{ backgroundColor: getStatusColor(product.status) }}
                      >
                        {getStatusText(product.status)}
                      </span>
                    </td>
                    <td>{product.salesCount || 0}</td>
                    <td>
                      {product.createdAt
                        ? new Date(product.createdAt).toLocaleDateString()
                        : '-'}
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="edit-btn"
                          onClick={() => openEditModal(product)}
                        >
                          编辑
                        </button>
                        <select
                          className="status-select"
                          value={product.status}
                          onChange={(e) =>
                            handleStatusChange(product._id!, e.target.value)
                          }
                        >
                          <option value="active">在售</option>
                          <option value="inactive">下架</option>
                          <option value="out_of_stock">缺货</option>
                        </select>
                        <button
                          className="delete-btn"
                          onClick={() => handleDeleteProduct(product._id!)}
                        >
                          删除
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 分页 */}
          <div className="pagination">
            <button
              disabled={pagination.page === 1}
              onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
            >
              上一页
            </button>
            <span>
              第 {pagination.page} / {pagination.totalPages} 页，共 {pagination.total} 条
            </span>
            <button
              disabled={pagination.page === pagination.totalPages}
              onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
            >
              下一页
            </button>
          </div>
        </>
      )}

      {/* 商品表单弹窗 */}
      <ProductFormModal
        visible={modalVisible}
        product={currentProduct}
        merchants={merchants}
        onClose={() => {
          setModalVisible(false);
          setCurrentProduct(null);
        }}
        onSubmit={currentProduct ? handleUpdateProduct : handleCreateProduct}
      />

      <style>{`
        .product-management {
          padding: 24px;
        }

        .page-header h1 {
          margin: 0 0 24px 0;
          font-size: 28px;
          color: #333;
        }

        .statistics-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }

        .stat-card {
          background: white;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .stat-label {
          font-size: 14px;
          color: #666;
          margin-bottom: 8px;
        }

        .stat-value {
          font-size: 32px;
          font-weight: bold;
          color: #1976D2;
        }

        .toolbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          gap: 16px;
        }

        .search-box {
          display: flex;
          gap: 8px;
          flex: 1;
        }

        .search-box input {
          flex: 1;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
        }

        .search-box button {
          padding: 10px 24px;
          background: #1976D2;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }

        .filters {
          display: flex;
          gap: 12px;
        }

        .filters select {
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
          background: white;
          cursor: pointer;
        }

        .create-btn {
          padding: 10px 24px;
          background: #4CAF50;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
        }

        .create-btn:hover {
          background: #45a049;
        }

        .product-table {
          background: white;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .product-table table {
          width: 100%;
          border-collapse: collapse;
        }

        .product-table th {
          background: #f5f5f5;
          padding: 16px;
          text-align: middle;
          font-weight: 600;
          color: #333;
          border-bottom: 2px solid #e0e0e0;
        }

        .product-table td {
          padding: 16px;
          border-bottom: 1px solid #e0e0e0;
        }

        .product-table tr:hover {
          background: #f9f9f9;
        }

        .product-name {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .product-name small {
          color: #666;
          font-size: 12px;
        }

        .status-badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 12px;
          color: white;
          font-size: 12px;
          font-weight: 500;
        }

        .action-buttons {
          display: flex;
          gap: 8px;
          justify-content: center;
        }

        .edit-btn,
        .delete-btn {
          padding: 6px 12px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
        }

        .edit-btn {
          background: #2196F3;
          color: white;
        }

        .delete-btn {
          background: #F44336;
          color: white;
        }

        .status-select {
          padding: 6px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 12px;
          cursor: pointer;
        }

        .pagination {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 16px;
          margin-top: 24px;
          padding: 16px;
        }

        .pagination button {
          padding: 8px 16px;
          background: #1976D2;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }

        .pagination button:disabled {
          background: #ccc;
          cursor: not-allowed;
        }

        .loading {
          text-align: center;
          padding: 40px;
          color: #666;
        }
      `}</style>
    </div>
  );
};

export default ProductManagement;
