import { Masonry } from "antd";
import UserHomeItem from "../../components/UserMobile/UserHomeItem";
import { getHomeData } from "../../services/UserMobile/homeService";
import { useEffect, useState, useRef } from "react";
import React from "react";
import type { Product } from "../../services/productService";

const UserHome: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [data, setData] = useState<Product[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const observerTarget = useRef<HTMLDivElement>(null);
  const limit = 10; // 每页加载数量

  // 加载数据
  const loadData = async (pageNum: number, append: boolean = false) => {
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }

    try {
      const res = await getHomeData(pageNum, limit);
      if (res.code === 200) {
        const products = res.data.products || [];
        const pagination = res.data.pagination || {};
        if (append) {
          // 追加数据
          setData(prev => [...prev, ...products]);
        } else {
          // 替换数据（首次加载）
          setData(products);
        }
        // 判断是否还有更多数据
        const totalPages = pagination.totalPages || 0;
        setHasMore(pageNum < totalPages);
        
        console.log(`加载第 ${pageNum} 页，共 ${products.length} 条数据，总页数: ${totalPages}`);
      }
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // 初始加载
  useEffect(() => {
    loadData(1, false);
  }, []);

  // 无限滚动：使用 Intersection Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        // 当哨兵元素进入视口，且还有更多数据，且不在加载中时，加载下一页
        if (entries[0]?.isIntersecting && hasMore && !loading && !loadingMore) {
          const nextPage = page + 1;
          setPage(nextPage);
          loadData(nextPage, true);
        }
      },
      {
        threshold: 0.1, // 当10%的元素可见时触发
      }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, loading, loadingMore, page]);

  // 首次加载时的加载状态
  if (loading && data.length === 0) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>推荐加载中...</div>;
  }

  return (
    <div style={{ 
      width: "calc(100% + 28px)",
      marginLeft: "-14px",
      marginRight: "-14px",
      paddingLeft: "8px",
      paddingRight: "8px",
    }}>
      <Masonry
        columns={2}
        gutter={8}
        items={data.map((item, index) => ({
          key: item._id || `item-${index}`,
          data: item,
        }))}
        itemRender={({ data }) => <UserHomeItem data={data} />}
      />
      
      {/* 无限滚动的哨兵元素 */}
      <div ref={observerTarget} style={{ height: '20px', marginTop: '10px' }}>
        {loadingMore && (
          <div style={{ textAlign: 'center', padding: '10px', color: '#999' }}>
            加载更多...
          </div>
        )}
        {!hasMore && data.length > 0 && (
          <div style={{ textAlign: 'center', padding: '10px', color: '#999' }}>
            没有更多了
          </div>
        )}
      </div>
    </div>
  );
};

export default UserHome;
