package com.example.TVM.repository;

import com.example.TVM.entity.BlogPost;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BlogPostRepository extends JpaRepository<BlogPost, Long> {
    
    List<BlogPost> findByIsPublishedTrueOrderByPublishedDateDesc();
    
    List<BlogPost> findByCategoryAndIsPublishedTrueOrderByPublishedDateDesc(String category);
    
    List<BlogPost> findByIsPublishedTrueAndCategoryOrderByPublishedDateDesc(String category);
}
