package com.example.TVM.controller;

import com.example.TVM.entity.BlogPost;
import com.example.TVM.service.BlogPostService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/blog")
@CrossOrigin(origins = "http://localhost:4200")
public class BlogController {
    
    @Autowired
    private BlogPostService blogPostService;
    
    @GetMapping
    public ResponseEntity<List<BlogPost>> getAllPublishedPosts() {
        List<BlogPost> posts = blogPostService.getAllPublishedPosts();
        return ResponseEntity.ok(posts);
    }
    
    @GetMapping("/all")
    public ResponseEntity<List<BlogPost>> getAllPosts() {
        List<BlogPost> posts = blogPostService.getAllPosts();
        return ResponseEntity.ok(posts);
    }
    
    @GetMapping("/category/{category}")
    public ResponseEntity<List<BlogPost>> getPostsByCategory(@PathVariable String category) {
        List<BlogPost> posts = blogPostService.getPostsByCategory(category);
        return ResponseEntity.ok(posts);
    }
    
    @PostMapping
    public ResponseEntity<BlogPost> createPost(@RequestBody BlogPost blogPost) {
        try {
            BlogPost savedPost = blogPostService.savePost(blogPost);
            return ResponseEntity.status(HttpStatus.CREATED).body(savedPost);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<BlogPost> getPostById(@PathVariable Long id) {
        Optional<BlogPost> post = blogPostService.getPostById(id);
        return post.map(ResponseEntity::ok)
                  .orElse(ResponseEntity.notFound().build());
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<BlogPost> updatePost(@PathVariable Long id, @RequestBody BlogPost blogPost) {
        Optional<BlogPost> existingPost = blogPostService.getPostById(id);
        if (existingPost.isPresent()) {
            blogPost.setId(id);
            BlogPost updatedPost = blogPostService.updatePost(blogPost);
            return ResponseEntity.ok(updatedPost);
        }
        return ResponseEntity.notFound().build();
    }
    
    @PutMapping("/{id}/publish")
    public ResponseEntity<BlogPost> publishPost(@PathVariable Long id) {
        BlogPost publishedPost = blogPostService.publishPost(id);
        if (publishedPost != null) {
            return ResponseEntity.ok(publishedPost);
        }
        return ResponseEntity.notFound().build();
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePost(@PathVariable Long id) {
        Optional<BlogPost> post = blogPostService.getPostById(id);
        if (post.isPresent()) {
            blogPostService.deletePost(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}
