useEffect(() => {
  fetch(`http://localhost:4000/refeicoes/${user.id}`)
    .then(res => res.json())
    .then(data => setRefeicoes(data));
}, [user]);
