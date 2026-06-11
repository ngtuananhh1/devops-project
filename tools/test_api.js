async function main(){
  try{
    const post = await fetch('http://localhost:8080/api/todos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'test from script' })
    });
    const postBody = await post.text();
    console.log('POST response:', post.status, postBody);

    const get = await fetch('http://localhost:8080/api/todos');
    const getBody = await get.json();
    console.log('GET response count:', Array.isArray(getBody) ? getBody.length : 'not-array');
    console.log(getBody);
  }catch(e){
    console.error('Error:', e);
  }
}

main();
