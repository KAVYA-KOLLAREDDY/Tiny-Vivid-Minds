package com.example.TVM.config;

import com.example.TVM.entity.BlogPost;
import com.example.TVM.entity.Feedback;
import com.example.TVM.repository.BlogPostRepository;
import com.example.TVM.repository.FeedbackRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.Arrays;

@Component
public class DataInitializer implements CommandLineRunner {
    
    @Autowired
    private FeedbackRepository feedbackRepository;
    
    @Autowired
    private BlogPostRepository blogPostRepository;
    
    @Override
    public void run(String... args) throws Exception {
        // Initialize sample feedback data
        if (feedbackRepository.count() == 0) {
            Feedback feedback1 = new Feedback();
            feedback1.setName("Sarah Johnson");
            feedback1.setEmail("sarah.johnson@email.com");
            feedback1.setRating(5);
            feedback1.setMessage("My daughter's confidence in math has skyrocketed since joining Tiny Vivid Minds. The abacus program is amazing!");
            feedback1.setChildName("Emma");
            feedback1.setChildAge(8);
            feedback1.setCourse("Abacus");
            feedback1.setIsApproved(true);
            feedback1.setCreatedAt(LocalDateTime.now().minusDays(5));
            feedbackRepository.save(feedback1);
            
            Feedback feedback2 = new Feedback();
            feedback2.setName("Michael Chen");
            feedback2.setEmail("michael.chen@email.com");
            feedback2.setRating(5);
            feedback2.setMessage("The personalized coaching has made such a difference. My son went from struggling to loving math!");
            feedback2.setChildName("Alex");
            feedback2.setChildAge(10);
            feedback2.setCourse("Personalized Coaching");
            feedback2.setIsApproved(true);
            feedback2.setCreatedAt(LocalDateTime.now().minusDays(3));
            feedbackRepository.save(feedback2);
            
            Feedback feedback3 = new Feedback();
            feedback3.setName("Priya Sharma");
            feedback3.setEmail("priya.sharma@email.com");
            feedback3.setRating(5);
            feedback3.setMessage("Vedic Maths techniques are incredible! My daughter can solve complex problems in seconds now.");
            feedback3.setChildName("Maya");
            feedback3.setChildAge(12);
            feedback3.setCourse("Vedic Maths");
            feedback3.setIsApproved(true);
            feedback3.setCreatedAt(LocalDateTime.now().minusDays(1));
            feedbackRepository.save(feedback3);
        }
        
        // Initialize sample blog posts
        if (blogPostRepository.count() == 0) {
            BlogPost post1 = new BlogPost();
            post1.setTitle("5 Benefits of Learning Abacus Early");
            post1.setExcerpt("Discover how early abacus training can transform your child's mathematical abilities and cognitive development.");
            post1.setContent("Learning abacus at an early age provides numerous benefits that extend far beyond simple arithmetic. Here are the top 5 benefits:\n\n1. **Enhanced Brain Development**: Abacus training stimulates both left and right hemispheres of the brain, promoting balanced cognitive development.\n\n2. **Improved Concentration**: The visual and tactile nature of abacus learning helps children develop better focus and attention span.\n\n3. **Mental Math Mastery**: Children learn to perform complex calculations mentally without relying on calculators or paper.\n\n4. **Boosted Confidence**: Success in abacus calculations builds self-esteem and confidence in mathematical abilities.\n\n5. **Better Problem-Solving Skills**: The systematic approach to abacus calculations enhances logical thinking and problem-solving capabilities.\n\nAt Tiny Vivid Minds, we believe that starting abacus training between ages 4-8 provides the optimal foundation for mathematical success.");
            post1.setAuthor("Dr. Sarah Williams");
            post1.setPublishedDate(LocalDateTime.now().minusDays(10));
            post1.setCategory("Abacus");
            post1.setTags(Arrays.asList("abacus", "early learning", "brain development", "math skills"));
            post1.setIsPublished(true);
            post1.setCreatedAt(LocalDateTime.now().minusDays(10));
            blogPostRepository.save(post1);
            
            BlogPost post2 = new BlogPost();
            post2.setTitle("How Vedic Maths Boosts Brain Power");
            post2.setExcerpt("Explore the ancient wisdom of Vedic Mathematics and its modern applications in enhancing cognitive abilities.");
            post2.setContent("Vedic Mathematics, derived from ancient Indian scriptures, offers powerful techniques that can significantly boost brain power and mathematical abilities. Here's how:\n\n**Speed and Accuracy**: Vedic Maths techniques enable students to perform calculations 10-15 times faster than conventional methods while maintaining accuracy.\n\n**Pattern Recognition**: The system teaches students to recognize mathematical patterns, enhancing their analytical thinking skills.\n\n**Memory Enhancement**: The structured approach of Vedic Maths improves memory retention and recall abilities.\n\n**Creative Problem Solving**: Students learn multiple approaches to solve the same problem, fostering creativity and flexibility in thinking.\n\n**Reduced Math Anxiety**: The simplicity and elegance of Vedic techniques make mathematics more approachable and less intimidating.\n\nOur Vedic Maths program at Tiny Vivid Minds incorporates these ancient techniques with modern teaching methods to maximize learning outcomes.");
            post2.setAuthor("Prof. Rajesh Kumar");
            post2.setPublishedDate(LocalDateTime.now().minusDays(7));
            post2.setCategory("Vedic Maths");
            post2.setTags(Arrays.asList("vedic maths", "brain power", "speed calculation", "ancient wisdom"));
            post2.setIsPublished(true);
            post2.setCreatedAt(LocalDateTime.now().minusDays(7));
            blogPostRepository.save(post2);
            
            BlogPost post3 = new BlogPost();
            post3.setTitle("Tips to Overcome Math Anxiety");
            post3.setExcerpt("Practical strategies to help children overcome math anxiety and develop a positive relationship with mathematics.");
            post3.setContent("Math anxiety is a common issue that affects many children, but it can be overcome with the right approach. Here are some effective strategies:\n\n**Create a Positive Environment**: Make math learning fun and engaging rather than stressful. Use games, puzzles, and real-world examples.\n\n**Start with Success**: Begin with problems your child can solve easily to build confidence before moving to more challenging concepts.\n\n**Use Visual Aids**: Tools like abacus, number lines, and visual representations make abstract concepts more concrete and understandable.\n\n**Encourage Mistakes**: Teach children that mistakes are part of learning. Focus on the process rather than just the final answer.\n\n**Personalized Learning**: Every child learns differently. Personalized coaching can address individual learning styles and pace.\n\n**Celebrate Progress**: Acknowledge and celebrate small victories to build motivation and self-esteem.\n\nAt Tiny Vivid Minds, our personalized coaching approach is specifically designed to address math anxiety and build confidence in every student.");
            post3.setAuthor("Ms. Jennifer Adams");
            post3.setPublishedDate(LocalDateTime.now().minusDays(3));
            post3.setCategory("Personalized Coaching");
            post3.setTags(Arrays.asList("math anxiety", "confidence building", "personalized learning", "positive mindset"));
            post3.setIsPublished(true);
            post3.setCreatedAt(LocalDateTime.now().minusDays(3));
            blogPostRepository.save(post3);
        }

        // Initialize sample level content and activities
        initializeSampleLevelData();
    }

    private void initializeSampleLevelData() {
        // This would initialize sample level content and activities
        // For now, we'll create them programmatically when needed
        System.out.println("Sample level data initialization completed");
    }
}
