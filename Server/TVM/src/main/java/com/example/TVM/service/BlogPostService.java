package com.example.TVM.service;

import com.example.TVM.entity.BlogPost;
import com.example.TVM.repository.BlogPostRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class BlogPostService {
    
    @Autowired
    private BlogPostRepository blogPostRepository;
    
    public List<BlogPost> getAllPublishedPosts() {
        return blogPostRepository.findByIsPublishedTrueOrderByPublishedDateDesc();
    }
    
    public List<BlogPost> getPostsByCategory(String category) {
        return blogPostRepository.findByCategoryAndIsPublishedTrueOrderByPublishedDateDesc(category);
    }
    
    public List<BlogPost> getAllPosts() {
        return blogPostRepository.findAll();
    }
    
    public BlogPost savePost(BlogPost blogPost) {
        return blogPostRepository.save(blogPost);
    }
    
    public Optional<BlogPost> getPostById(Long id) {
        return blogPostRepository.findById(id);
    }
    
    public BlogPost updatePost(BlogPost blogPost) {
        return blogPostRepository.save(blogPost);
    }
    
    public void deletePost(Long id) {
        blogPostRepository.deleteById(id);
    }
    
    public BlogPost publishPost(Long id) {
        Optional<BlogPost> postOpt = blogPostRepository.findById(id);
        if (postOpt.isPresent()) {
            BlogPost post = postOpt.get();
            post.setIsPublished(true);
            return blogPostRepository.save(post);
        }
        return null;
    }
}
