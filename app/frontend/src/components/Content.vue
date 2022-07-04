<script>
import { reactive, ref } from 'vue';

export default {
  name: 'app-content',
  setup() {
    const serverUrl = import.meta.env.VITE_SERVER_URL;
    const isLoaded = ref(false);
    const post = reactive({ title: '', body: '' });
    const fetchPost = () => {
      const url = new URL('api/posts', serverUrl);
      console.log('Href: ', url.href);
      return fetch(url.href)
        .then(response => response.json())
        .then(({ data }) => {
          const [firstPost] = data;
          post.title = firstPost.title;
          post.body = firstPost.content;
        })
        .finally(() => { isLoaded.value = true });
    }

    return { isLoaded, post, fetchPost };
  }
}
</script>

<template>
  <div>
    <button @click="fetchPost">Fetch content</button>
  </div> 
  <div v-if="isLoaded">
    <h3>{{ post.title }}</h3>
    <p>{{ post.body }}</p>
  </div>
</template>
