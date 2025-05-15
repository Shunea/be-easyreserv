function prettify(object) {
  const pretty = JSON.parse(JSON.stringify(object));

  return pretty;
}

export default prettify;
